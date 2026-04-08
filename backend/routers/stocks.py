from fastapi import APIRouter
from logging_config import get_logger
import httpx
from datetime import datetime

router = APIRouter(prefix="/stocks", tags=["Stocks"])
logger = get_logger(__name__)

# Cache dictionary to store data to prevent rate-limiting (simple in-memory cache)
# Format: {"nifty": {"data": { ... }, "timestamp": <datetime>}
cache = {}

CACHE_TTL_SECONDS = 300 # 5 minutes

async def fetch_yahoo_finance(ticker: str, range_obj: str = "1mo") -> dict:
    """Fetch index data from Yahoo Finance API for given ticker."""
    
    # Map range to yfinance range and interval, and date format
    range_map = {
        "1d": {"range": "1d", "interval": "5m", "format": "%H:%M"},
        "1w": {"range": "5d", "interval": "15m", "format": "%b %d, %H:%M"},
        "1m": {"range": "1mo", "interval": "1d", "format": "%b %d"},
        "1y": {"range": "1y", "interval": "1d", "format": "%b %d, %Y"},
        "max": {"range": "max", "interval": "1mo", "format": "%b %Y"}
    }
    
    cfg = range_map.get(range_obj, range_map["1m"])
    range_query = cfg["range"]
    interval = cfg["interval"]
    dt_format = cfg["format"]

    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
    async with httpx.AsyncClient(timeout=10, headers={"User-Agent": "Mozilla/5.0 (compatible; FinTrack/1.0)"}) as client:
        try:
            response = await client.get(url, params={"interval": interval, "range": range_query})
            if response.status_code == 200:
                data = response.json()
                if data.get("chart", {}).get("result"):
                    result = data["chart"]["result"][0]
                    meta = result.get("meta", {})
                    timestamps = result.get("timestamp", [])
                    indicators = result.get("indicators", {}).get("quote", [{}])[0]
                    closes = indicators.get("close", [])
                    
                    if not timestamps or not closes:
                        return None
                    
                    # Compute history array mapping timestamp to close price (filter out nulls)
                    history = []
                    for ts, cp in zip(timestamps, closes):
                        if cp is not None:
                            # Yahoo timestamp is epoch seconds
                            dt = datetime.fromtimestamp(ts).strftime(dt_format)
                            history.append({"date": dt, "amount": round(cp, 2)})
                    
                    current_price = meta.get("regularMarketPrice", 0)
                    previous_close = meta.get("previousClose", 0)
                    day_high = meta.get("regularMarketDayHigh", 0)
                    day_low = meta.get("regularMarketDayLow", 0)
                    
                    # Calculate percentage change
                    change = current_price - previous_close
                    change_percent = (change / previous_close * 100) if previous_close else 0
                    
                    return {
                        "symbol": ticker,
                        "currency": meta.get("currency", "USD"),
                        "current_price": round(current_price, 2),
                        "previous_close": round(previous_close, 2),
                        "change": round(change, 2),
                        "change_percent": round(change_percent, 2),
                        "day_high": round(day_high, 2),
                        "day_low": round(day_low, 2),
                        "history": history
                    }
        except Exception as e:
            logger.error(f"Error fetching {ticker} from Yahoo Finance: {str(e)}")
    return None

@router.get("/market-indices")
async def get_market_indices(range: str = "1m"):
    """Returns Nifty 50 and NASDAQ data, caching results for 5 minutes."""
    now = datetime.now()
    cache_key = f"market_indices_{range}"
    
    # Check cache
    cached_data = cache.get(cache_key)
    if cached_data and (now - cached_data["timestamp"]).total_seconds() < CACHE_TTL_SECONDS:
        return cached_data["data"]
        
    nifty = await fetch_yahoo_finance("^NSEI", range)
    nasdaq = await fetch_yahoo_finance("^IXIC", range)
    
    response_data = {
        "nifty": nifty,
        "nasdaq": nasdaq,
        "updated_at": now.isoformat()
    }
    
    # Only cache if data is valid (both didn't fail)
    if nifty or nasdaq:
        cache[cache_key] = {"data": response_data, "timestamp": now}
        
    return response_data
