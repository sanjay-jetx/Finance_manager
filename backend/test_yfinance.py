import asyncio
import httpx
import json

async def main():
    async with httpx.AsyncClient(timeout=10, headers={
        "User-Agent": "Mozilla/5.0"
    }) as client:
        for ticker in ["^NSEI", "^IXIC"]:
            r = await client.get(
                f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}",
                params={"interval": "1d", "range": "1mo"},
            )
            data = r.json()
            if data["chart"]["result"]:
                print(f"{ticker} SUCCESS: {len(data['chart']['result'][0]['timestamp'])} points")
            else:
                print(f"{ticker} FAILED")

if __name__ == "__main__":
    asyncio.run(main())
