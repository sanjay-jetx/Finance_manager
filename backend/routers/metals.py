"""
Gold & Silver Holdings Router
- GET  /metals/rates        → fetch live rates (cached 24h in DB)
- GET  /metals/holdings     → get user's holdings from DB
- POST /metals/holdings     → save/update user's holdings
- GET  /metals/portfolio    → full portfolio value summary
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from dependencies import get_current_user
from database.connection import get_db
from logging_config import get_logger
from datetime import datetime, timedelta, timezone
import httpx

router = APIRouter(prefix="/metals", tags=["Metals"])
logger = get_logger(__name__)


# ── Schemas ─────────────────────────────────────────────────────────────────

class HoldingsSchema(BaseModel):
    gold_grams: float = Field(0.0, ge=0)
    gold_purity: str  = "24K"               # "24K" | "22K" | "18K"
    silver_grams: float = Field(0.0, ge=0)


# ── Purity multipliers (relative to 24K = 1.0) ──────────────────────────────

PURITY = {"24K": 1.0, "22K": 22/24, "18K": 18/24}


# ── Live Rate Fetcher (with 24-hour DB cache) ────────────────────────────────

async def _fetch_live_rates() -> dict:
    """
    Fetch live gold & silver prices — NO API KEY needed.
    Sources:
      1. Yahoo Finance (GC=F gold futures, SI=F silver futures) — completely free
      2. Frankfurter.app (USD → INR forex) — completely free, no key
      3. Fallback realistic India rates if both fail
    """
    TROY_OZ_TO_GRAM = 31.1035   # 1 troy oz = 31.1035 grams
    INDIA_PREMIUM   = 1.025     # India typically trades ~2.5% above spot

    async with httpx.AsyncClient(timeout=10, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }) as client:

        # ── Step 1: Get USD/INR exchange rate (Frankfurter — free, no key) ──
        usd_to_inr = 83.5   # safe fallback
        try:
            fx = await client.get("https://api.frankfurter.app/latest?from=USD&to=INR")
            if fx.status_code == 200:
                usd_to_inr = fx.json()["rates"]["INR"]
                logger.info("USD/INR = %.2f", usd_to_inr)
        except Exception as e:
            logger.warning("Frankfurter FX failed: %s — using fallback %.2f", e, usd_to_inr)

        # ── Step 2: Gold futures (GC=F) from Yahoo Finance — free, no key ──
        gold_per_gram = None
        try:
            g = await client.get(
                "https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF",
                params={"interval": "1d", "range": "1d"},
            )
            if g.status_code == 200:
                result = g.json()["chart"]["result"][0]
                gold_usd_oz = result["meta"]["regularMarketPrice"]   # USD per troy oz
                gold_per_gram = round(
                    (gold_usd_oz / TROY_OZ_TO_GRAM) * usd_to_inr * INDIA_PREMIUM, 2
                )
                logger.info("Gold: $%.2f/oz → ₹%.2f/g", gold_usd_oz, gold_per_gram)
        except Exception as e:
            logger.warning("Yahoo gold fetch failed: %s", e)

        # ── Step 3: Silver futures (SI=F) from Yahoo Finance ────────────────
        silver_per_gram = None
        try:
            s = await client.get(
                "https://query1.finance.yahoo.com/v8/finance/chart/SI%3DF",
                params={"interval": "1d", "range": "1d"},
            )
            if s.status_code == 200:
                result = s.json()["chart"]["result"][0]
                silver_usd_oz = result["meta"]["regularMarketPrice"]
                silver_per_gram = round(
                    (silver_usd_oz / TROY_OZ_TO_GRAM) * usd_to_inr * INDIA_PREMIUM, 2
                )
                logger.info("Silver: $%.2f/oz → ₹%.2f/g", silver_usd_oz, silver_per_gram)
        except Exception as e:
            logger.warning("Yahoo silver fetch failed: %s", e)

    # ── Step 4: Fallback if any failed ──────────────────────────────────────
    if not gold_per_gram:
        gold_per_gram  = 9150.0   # ₹9,150/g — realistic 2025 India 24K rate
        logger.info("Using fallback gold rate: ₹%.2f/g", gold_per_gram)
    if not silver_per_gram:
        silver_per_gram = 95.0    # ₹95/g
        logger.info("Using fallback silver rate: ₹%.2f/g", silver_per_gram)

    source = "Yahoo Finance + Frankfurter (live)" if gold_per_gram != 9150.0 else "Fallback rates"

    return {
        "gold_24k_per_gram": gold_per_gram,
        "silver_per_gram":   silver_per_gram,
        "usd_to_inr":        usd_to_inr,
        "source":            source,
        "fetched_at":        datetime.now(timezone.utc).isoformat(),
    }



async def get_cached_rates() -> dict:
    """Return cached rates if < 24h old, else refetch."""
    db = get_db()
    cached = await db.metal_rates.find_one({"_id": "global"})
    
    if cached:
        fetched = cached.get("fetched_at")
        if isinstance(fetched, datetime):
            age = datetime.now(timezone.utc) - fetched.replace(tzinfo=timezone.utc)
            if age < timedelta(hours=24):
                cached.pop("_id", None)
                return cached

    # Fetch fresh rates
    rates = await _fetch_live_rates()
    rates["fetched_at_dt"] = datetime.now(timezone.utc)
    await db.metal_rates.replace_one({"_id": "global"}, {"_id": "global", **rates}, upsert=True)
    return rates


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/rates")
async def get_metal_rates():
    """Public endpoint — returns live gold & silver rates in INR."""
    rates = await get_cached_rates()
    gold24 = rates["gold_24k_per_gram"]
    return {
        "gold": {
            "24K": gold24,
            "22K": round(gold24 * PURITY["22K"], 2),
            "18K": round(gold24 * PURITY["18K"], 2),
        },
        "silver": rates["silver_per_gram"],
        "unit":   "per gram (INR)",
        "source": rates.get("source"),
        "fetched_at": rates.get("fetched_at"),
    }


@router.get("/holdings")
async def get_holdings(user_id: str = Depends(get_current_user)):
    """Get user's saved gold/silver holdings."""
    db = get_db()
    doc = await db.metal_holdings.find_one({"user_id": user_id})
    if not doc:
        return {"gold_grams": 0.0, "gold_purity": "24K", "silver_grams": 0.0}
    doc.pop("_id", None)
    doc.pop("user_id", None)
    return doc


@router.post("/holdings")
async def save_holdings(data: HoldingsSchema, user_id: str = Depends(get_current_user)):
    """Save / update user's gold & silver holdings."""
    if data.gold_purity not in PURITY:
        raise HTTPException(status_code=400, detail=f"Invalid purity. Choose: {list(PURITY)}")
    db = get_db()
    doc = {
        "user_id":      user_id,
        "gold_grams":   data.gold_grams,
        "gold_purity":  data.gold_purity,
        "silver_grams": data.silver_grams,
        "updated_at":   datetime.now(timezone.utc),
    }
    await db.metal_holdings.replace_one({"user_id": user_id}, doc, upsert=True)
    return {"message": "Holdings saved"}


@router.get("/portfolio")
async def get_portfolio(user_id: str = Depends(get_current_user)):
    """Full portfolio — holdings × live rates = total value."""
    db  = get_db()
    doc = await db.metal_holdings.find_one({"user_id": user_id})
    if not doc:
        doc = {"gold_grams": 0.0, "gold_purity": "24K", "silver_grams": 0.0}

    rates = await get_cached_rates()
    gold24 = rates["gold_24k_per_gram"]
    silver = rates["silver_per_gram"]

    purity_mult = PURITY.get(doc.get("gold_purity", "24K"), 1.0)
    effective_rate = round(gold24 * purity_mult, 2)
    gold_value     = round(doc.get("gold_grams", 0) * effective_rate, 2)
    silver_value   = round(doc.get("silver_grams", 0) * silver, 2)

    return {
        "gold": {
            "grams":          doc.get("gold_grams", 0),
            "purity":         doc.get("gold_purity", "24K"),
            "rate_per_gram":  effective_rate,
            "rate_24k":       gold24,
            "value":          gold_value,
        },
        "silver": {
            "grams":         doc.get("silver_grams", 0),
            "rate_per_gram": silver,
            "value":         silver_value,
        },
        "total_value": round(gold_value + silver_value, 2),
        "source":      rates.get("source"),
        "fetched_at":  rates.get("fetched_at"),
        "rates_all": {
            "gold_24k": gold24,
            "gold_22k": round(gold24 * PURITY["22K"], 2),
            "gold_18k": round(gold24 * PURITY["18K"], 2),
            "silver":   silver,
        }
    }
