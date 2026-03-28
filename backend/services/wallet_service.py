from __future__ import annotations

from typing import Any, Tuple
from fastapi import HTTPException
from pymongo import ReturnDocument

from database.connection import get_db


async def get_or_create_wallet(user_id: str, email: str = None):
    db = get_db()
    wallet = await db.wallets.find_one({"user_id": user_id})
    if not wallet:
        new_wallet = {"user_id": user_id, "cash_balance": 0.0, "upi_balance": 0.0}
        if email:
            new_wallet["email"] = email
        result = await db.wallets.insert_one(new_wallet)
        new_wallet["_id"] = str(result.inserted_id)
        return new_wallet
    wallet["_id"] = str(wallet["_id"])
    return wallet


def _balance_field(wallet_type: str) -> str:
    return f"{wallet_type}_balance"


async def get_balance(user_id: str, wallet_type: str) -> float:
    db = get_db()
    wallet = await db.wallets.find_one({"user_id": user_id})
    if not wallet:
        return 0.0
    return wallet.get(_balance_field(wallet_type), 0.0)


async def update_balance(user_id: str, wallet_type: str, new_balance: float):
    db = get_db()
    await db.wallets.update_one(
        {"user_id": user_id},
        {"$set": {_balance_field(wallet_type): new_balance}},
        upsert=True,
    )


async def debit_wallet_atomic(
    user_id: str,
    wallet_type: str,
    amount: float,
    *,
    session: Any = None,
) -> Tuple[float, float]:
    """
    Atomically subtract amount if balance >= amount ($inc + $gte guard).
    Eliminates TOCTOU between two concurrent spenders on the same wallet.
    """
    db = get_db()
    field = _balance_field(wallet_type)
    amt = round(float(amount), 2)
    coll = db.wallets
    updated = await coll.find_one_and_update(
        {"user_id": user_id, field: {"$gte": amt}},
        {"$inc": {field: -amt}},
        return_document=ReturnDocument.AFTER,
        session=session,
    )
    if updated is None:
        current = await coll.find_one({"user_id": user_id}, session=session)
        if not current:
            raise HTTPException(status_code=400, detail="Wallet not found")
        have = float(current.get(field, 0.0))
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient {wallet_type} balance (have ₹{have:.2f})",
        )
    after = round(float(updated[field]), 2)
    before = round(after + amt, 2)
    return before, after


async def credit_wallet_atomic(
    user_id: str,
    wallet_type: str,
    amount: float,
    *,
    session: Any = None,
) -> Tuple[float, float]:
    """Atomically add amount via $inc (wallet row must exist)."""
    db = get_db()
    field = _balance_field(wallet_type)
    amt = round(float(amount), 2)
    updated = await db.wallets.find_one_and_update(
        {"user_id": user_id},
        {"$inc": {field: amt}},
        return_document=ReturnDocument.AFTER,
        session=session,
    )
    if updated is None:
        raise HTTPException(status_code=400, detail="Wallet not found")
    after = round(float(updated[field]), 2)
    before = round(after - amt, 2)
    return before, after


async def transfer_wallet_atomic(
    user_id: str,
    from_wallet: str,
    to_wallet: str,
    amount: float,
    *,
    session: Any = None,
) -> Tuple[float, float, float, float]:
    """
    Single-document atomic transfer: debit from_wallet, credit to_wallet.
    Same concurrency guarantees as debit_wallet_atomic for the source leg.
    """
    if from_wallet == to_wallet:
        raise HTTPException(status_code=400, detail="Cannot transfer to the same wallet")
    db = get_db()
    ff = _balance_field(from_wallet)
    tf = _balance_field(to_wallet)
    amt = round(float(amount), 2)
    updated = await db.wallets.find_one_and_update(
        {"user_id": user_id, ff: {"$gte": amt}},
        {"$inc": {ff: -amt, tf: amt}},
        return_document=ReturnDocument.AFTER,
        session=session,
    )
    if updated is None:
        current = await db.wallets.find_one({"user_id": user_id}, session=session)
        if not current:
            raise HTTPException(status_code=400, detail="Wallet not found")
        have = float(current.get(ff, 0.0))
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient {from_wallet} balance (have ₹{have:.2f})",
        )
    after_from = round(float(updated[ff]), 2)
    before_from = round(after_from + amt, 2)
    after_to = round(float(updated[tf]), 2)
    before_to = round(after_to - amt, 2)
    return before_from, after_from, before_to, after_to
