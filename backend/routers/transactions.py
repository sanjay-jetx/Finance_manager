from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from services.wallet_service import (
    credit_wallet_atomic,
    debit_wallet_atomic,
    get_balance,
    get_or_create_wallet,
    transfer_wallet_atomic,
    update_balance,
)
from database.connection import get_db, run_with_transaction
from schemas.transaction import ExpenseSchema, IncomeSchema, TransferSchema
from datetime import datetime, timezone
from bson import ObjectId
from fastapi.responses import StreamingResponse
import io
import csv

router = APIRouter(tags=["Transactions"])


def serialize(doc):
    doc["_id"] = str(doc["_id"])
    return doc


@router.post("/expense")
async def add_expense(data: ExpenseSchema, user_id: str = Depends(get_current_user)):
    db = get_db()
    await get_or_create_wallet(user_id)
    wt = data.wallet.value
    ts = datetime.now(timezone.utc)

    async def work(session):
        before_bal, after_bal = await debit_wallet_atomic(user_id, wt, data.amount, session=session)
        txn = {
            "user_id": user_id,
            "type": "expense",
            "amount": data.amount,
            "category": data.category,
            "wallet": wt,
            "notes": data.notes,
            "before_balance": before_bal,
            "after_balance": after_bal,
            "timestamp": ts,
        }
        return await db.transactions.insert_one(txn, session=session), after_bal

    result, after_bal = await run_with_transaction(work)

    # Check budget alert
    budget = await db.budgets.find_one({"user_id": user_id, "category": data.category})
    budget_alert = None
    if budget:
        now = datetime.now(timezone.utc)
        start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        pipeline = [
            {"$match": {
                "user_id": user_id,
                "type": "expense",
                "category": data.category,
                "timestamp": {"$gte": start_of_month}
            }},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        spent_cursor = db.transactions.aggregate(pipeline)
        current_spent = 0.0
        async for s in spent_cursor:
            current_spent = s["total"]

        if current_spent > budget["limit"]:
            budget_alert = f"⚠️ You exceeded your {data.category} budget!"
        elif current_spent > budget["limit"] * 0.8:
            budget_alert = f"⚠️ You've used over 80% of your {data.category} budget."

    return {
        "message": "Expense recorded",
        "id": str(result.inserted_id),
        "after_balance": after_bal,
        "budget_alert": budget_alert,
    }


@router.post("/income")
async def add_income(data: IncomeSchema, user_id: str = Depends(get_current_user)):
    db = get_db()
    await get_or_create_wallet(user_id)
    wt = data.wallet.value
    ts = datetime.now(timezone.utc)

    async def work(session):
        before_bal, after_bal = await credit_wallet_atomic(user_id, wt, data.amount, session=session)
        txn = {
            "user_id": user_id,
            "type": "income",
            "amount": data.amount,
            "category": "Income",
            "source": data.source,
            "wallet": wt,
            "notes": data.notes,
            "before_balance": before_bal,
            "after_balance": after_bal,
            "timestamp": ts,
        }
        res = await db.transactions.insert_one(txn, session=session)
        return res, after_bal

    result, after_bal = await run_with_transaction(work)
    return {"message": "Income recorded", "id": str(result.inserted_id), "after_balance": after_bal}


@router.get("/transactions")
async def get_transactions(
    limit: int = 50,
    wallet: str = None,
    type: str = None,
    user_id: str = Depends(get_current_user),
):
    db = get_db()
    query = {"user_id": user_id}
    if wallet:
        query["wallet"] = wallet
    if type:
        query["type"] = type

    cursor = db.transactions.find(query).sort("timestamp", -1).limit(limit)
    txns = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc["timestamp"] = doc["timestamp"].isoformat() if doc.get("timestamp") else None
        txns.append(doc)
    return {"transactions": txns, "count": len(txns)}


@router.post("/transfer")
async def transfer_wallet(data: TransferSchema, user_id: str = Depends(get_current_user)):
    db = get_db()
    await get_or_create_wallet(user_id)
    fw = data.from_wallet.value
    tw = data.to_wallet.value
    ts = datetime.now(timezone.utc)

    async def work(session):
        before_from, after_from, before_to, after_to = await transfer_wallet_atomic(
            user_id, fw, tw, data.amount, session=session
        )
        txn = {
            "user_id": user_id,
            "type": "transfer",
            "amount": data.amount,
            "category": "Transfer",
            "wallet": fw,
            "to_wallet": tw,
            "notes": f"Transfer from {fw} to {tw}",
            "before_balance": before_from,
            "after_balance": after_from,
            "timestamp": ts,
        }
        await db.transactions.insert_one(txn, session=session)
        return after_from, after_to

    new_from, new_to = await run_with_transaction(work)
    return {
        "message": "Transfer successful",
        f"{fw}_balance": new_from,
        f"{tw}_balance": new_to,
    }


@router.get("/transactions/export")
async def export_transactions(user_id: str = Depends(get_current_user)):
    db = get_db()
    cursor = db.transactions.find({"user_id": user_id}).sort("timestamp", -1)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Type", "Category", "Amount", "Wallet", "Notes"])

    async for doc in cursor:
        dt = doc.get("timestamp")
        date_str = dt.strftime("%Y-%m-%d %H:%M:%S") if dt else ""
        writer.writerow([
            date_str,
            doc.get("type", ""),
            doc.get("category", ""),
            doc.get("amount", 0),
            doc.get("wallet", ""),
            doc.get("notes", ""),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )


@router.delete("/{transaction_id}")
async def delete_transaction(transaction_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    try:
        txn = await db.transactions.find_one({"_id": ObjectId(transaction_id), "user_id": user_id})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid transaction ID")
        
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    typ = txn.get("type")
    amt = txn.get("amount", 0)
    
    if typ in ["expense", "lend", "goal_transfer"]:
        bal = await get_balance(user_id, txn.get("wallet", "cash"))
        await update_balance(user_id, txn.get("wallet", "cash"), round(bal + amt, 2))
    elif typ in ["income", "debt_return"]:
        bal = await get_balance(user_id, txn.get("wallet", "cash"))
        await update_balance(user_id, txn.get("wallet", "cash"), round(bal - amt, 2))
    elif typ == "transfer":
        from_w = txn.get("wallet")
        to_w = txn.get("to_wallet")
        if from_w and to_w:
            from_bal = await get_balance(user_id, from_w)
            to_bal = await get_balance(user_id, to_w)
            await update_balance(user_id, from_w, round(from_bal + amt, 2))
            await update_balance(user_id, to_w, round(to_bal - amt, 2))
            
    await db.transactions.delete_one({"_id": ObjectId(transaction_id)})
    return {"message": "Transaction deleted!"}
