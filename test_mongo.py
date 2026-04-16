import os
import time
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("backend/.env")
MONGO_URI = os.getenv("MONGO_URI")

async def test():
    print(f"Testing URI: {MONGO_URI}")
    start = time.time()
    try:
        client = AsyncIOMotorClient(MONGO_URI)
        db = client.test_connection
        # force a command to actually connect
        await db.command("ping")
        elapsed = time.time() - start
        print(f"[SUCCESS] Connected in {elapsed:.2f} seconds")
    except Exception as e:
        elapsed = time.time() - start
        print(f"[ERROR] Failed after {elapsed:.2f} seconds. Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
