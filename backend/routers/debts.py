from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from services.wallet_service import credit_wallet_atomic, debit_wallet_atomic, get_or_create_wallet
from database.connection import get_db, run_with_transaction
from schemas.debt import LendSchema, ReturnSchema
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId

router = APIRouter(tags=["Receivables"])


def _iso_utc(value):
    """Avoid 500s if a legacy document has a string or missing date field."""
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        try:
            return value.isoformat()
        except (AttributeError, TypeError, ValueError, OSError):
            return None
    return str(value) if value else None


@router.post("/lend")
async def lend_money(data: LendSchema, user_id: str = Depends(get_current_user)):
    db = get_db()
    await get_or_create_wallet(user_id)
    wallet_type = data.wallet.value
    return_dt = None
    if data.return_date:
        return_dt = datetime(
            data.return_date.year, data.return_date.month, data.return_date.day,
            tzinfo=timezone.utc
        )
    ts = datetime.now(timezone.utc)

    async def work(session):
        before_bal, after_bal = await debit_wallet_atomic(
            user_id, wallet_type, data.amount, session=session
        )
        debt_doc = {
            "user_id": user_id,
            "person_name": data.person_name,
            "amount": data.amount,
            "wallet": wallet_type,
            "notes": data.notes,
            "given_date": ts,
            "return_date": return_dt,
            "status": "pending",
            "before_balance": before_bal,
            "after_balance": after_bal,
        }
        dr = await db.debts.insert_one(debt_doc, session=session)
        txn = {
            "user_id": user_id,
            "type": "lend",
            "amount": data.amount,
            "category": "You lent (receivable)",
            "wallet": wallet_type,
            "notes": f"Lent to {data.person_name}",
            "before_balance": before_bal,
            "after_balance": after_bal,
            "timestamp": ts,
        }
        await db.transactions.insert_one(txn, session=session)
        return dr.inserted_id, after_bal

    inserted_id, after_bal = await run_with_transaction(work)
    return {
        "message": "Recorded — amount is owed back to you",
        "debt_id": str(inserted_id),
        "after_balance": after_bal,
    }


@router.patch("/return/{debt_id}")
async def return_debt(
    debt_id: str, data: ReturnSchema, user_id: str = Depends(get_current_user)
):
    """Mark a receivable as repaid. Wallet credit runs only after an atomic pending→returned transition."""
    db = get_db()

    try:
        obj_id = ObjectId(debt_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid receivable id")

    debt = await db.debts.find_one({"_id": obj_id, "user_id": user_id})
    if not debt:
        raise HTTPException(status_code=404, detail="Record not found")
    if debt.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Already marked as received")
    if debt.get("amount") is None:
        raise HTTPException(status_code=500, detail="Receivable record is missing amount")
    try:
        receivable_amount = float(debt["amount"])
    except (TypeError, ValueError):
        raise HTTPException(status_code=500, detail="Receivable record has invalid amount")
    if receivable_amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid receivable amount in record")

    wallet_type = data.wallet.value
    now = datetime.now(timezone.utc)

    async def work(session):
        claim = await db.debts.update_one(
            {"_id": obj_id, "user_id": user_id, "status": "pending"},
            {
                "$set": {
                    "status": "returned",
                    "returned_date": now,
                    "return_wallet": wallet_type,
                }
            },
            session=session,
        )
        if claim.modified_count != 1:
            raise HTTPException(
                status_code=409,
                detail="Could not confirm receipt — refresh the list and try again.",
            )
        before_bal, after_bal = await credit_wallet_atomic(
            user_id, wallet_type, receivable_amount, session=session
        )
        txn = {
            "user_id": user_id,
            "type": "income",
            "amount": receivable_amount,
            "category": "Receivable returned",
            "wallet": wallet_type,
            "notes": (
                f"Received from {pn}"
                if (pn := debt.get("person_name"))
                else "Receivable received"
            ),
            "before_balance": before_bal,
            "after_balance": after_bal,
            "timestamp": now,
        }
        await db.transactions.insert_one(txn, session=session)
        return after_bal

    after_bal = await run_with_transaction(work)
    return {"message": "Marked as received", "after_balance": after_bal}


@router.get("/debts")
async def get_debts(status: Optional[str] = None, user_id: str = Depends(get_current_user)):
    """List money you lent that is still owed back to you (and completed entries)."""
    db = get_db()
    if status is not None and status not in ("pending", "returned"):
        raise HTTPException(
            status_code=400,
            detail="status must be 'pending', 'returned', or omitted",
        )

    query = {"user_id": user_id}
    if status:
        query["status"] = status

    cursor = db.debts.find(query).sort("given_date", -1)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc["given_date"] = _iso_utc(doc.get("given_date"))
        doc["return_date"] = _iso_utc(doc.get("return_date")) if doc.get("return_date") else None
        doc["returned_date"] = _iso_utc(doc.get("returned_date")) if doc.get("returned_date") else None
        items.append(doc)

    count = len(items)
    return {
        "debts": items,
        "receivables": items,
        "count": count,
    }
