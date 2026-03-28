from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any, TypeVar, cast

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

import os

T = TypeVar("T")

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "finance_app")

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    print(f"[OK] Connected to MongoDB: {DB_NAME}")

    # Create indexes for performance & data integrity
    await db.users.create_index("email", unique=True)
    await db.wallets.create_index("user_id", unique=True)
    await db.transactions.create_index([("user_id", 1), ("timestamp", -1)])
    await db.transactions.create_index([("user_id", 1), ("type", 1)])
    # Outstanding / repaid money others owe you (receivables; stored as "debts" for API compatibility)
    await db.debts.create_index([("user_id", 1), ("status", 1)])
    await db.goals.create_index("user_id")
    await db.budgets.create_index([("user_id", 1), ("category", 1)], unique=True)
    print("[OK] MongoDB indexes created")


async def close_db():
    global client
    if client:
        client.close()
        print("[CLOSED] MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    return cast(AsyncIOMotorDatabase, db)


def get_client() -> AsyncIOMotorClient:
    """Motor client for multi-document transactions (requires replica set)."""
    if client is None:
        raise RuntimeError("MongoDB client is not initialized")
    return cast(AsyncIOMotorClient, client)


async def run_with_transaction(
    fn: Callable[[Any], Awaitable[T]],
) -> T:
    """
    Run fn(mongo_session_or_none) so wallet + ledger writes commit together.
    Set SKIP_MONGO_TRANSACTIONS=1 for standalone MongoDB (atomic $inc still prevents balance races).
    """
    if os.getenv("SKIP_MONGO_TRANSACTIONS", "").lower() in ("1", "true", "yes"):
        return await fn(None)
    cl = get_client()
    async with await cl.start_session() as session:
        async with session.start_transaction():
            return await fn(session)
