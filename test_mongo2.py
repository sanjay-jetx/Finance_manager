import os
import time
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("backend/.env")
MONGO_URI = os.getenv("MONGO_URI")

async def test():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.test_connection
    s1 = time.time()
    await db.command("ping")
    print(f"Ping 1: {time.time()-s1:.2f}s")
    s2 = time.time()
    await db.command("ping")
    print(f"Ping 2: {time.time()-s2:.2f}s")

if __name__ == "__main__":
    asyncio.run(test())
