from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from services.wallet_service import get_or_create_wallet, debit_wallet_atomic
from database.connection import get_db, run_with_transaction
from schemas.goal import GoalSchema, AddFundsSchema
from datetime import datetime, timezone
from bson import ObjectId

router = APIRouter(tags=["Goals"])


@router.post("/goals")
async def create_goal(data: GoalSchema, user_id: str = Depends(get_current_user)):
    db = get_db()
    goal_doc = {
        "user_id": user_id,
        "name": data.name,
        "target_amount": data.target_amount,
        "current_amount": 0.0,
        "deadline": data.deadline,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.goals.insert_one(goal_doc)
    return {"message": "Goal created", "goal_id": str(result.inserted_id)}


@router.get("/goals")
async def get_goals(user_id: str = Depends(get_current_user)):
    db = get_db()
    cursor = db.goals.find({"user_id": user_id})
    goals = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if doc.get("deadline"):
            doc["deadline"] = doc["deadline"].isoformat()
        if doc.get("created_at"):
            doc["created_at"] = doc["created_at"].isoformat()
        goals.append(doc)
    return {"goals": goals, "count": len(goals)}


@router.post("/goals/{goal_id}/add-funds")
async def add_funds_to_goal(
    goal_id: str, data: AddFundsSchema, user_id: str = Depends(get_current_user)
):
    db = get_db()

    try:
        obj_id = ObjectId(goal_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid goal ID")

    goal = await db.goals.find_one({"_id": obj_id, "user_id": user_id})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if goal.get("current_amount", 0.0) >= goal["target_amount"]:
        raise HTTPException(status_code=400, detail="Goal is already completed")

    await get_or_create_wallet(user_id)

    wallet_type = data.wallet.value
    new_goal_amount = round(goal.get("current_amount", 0.0) + data.amount, 2)
    now = datetime.now(timezone.utc)

    async def _do_transfer(session):
        # ✅ Atomic debit — raises 400 if insufficient balance (no race condition)
        before, after = await debit_wallet_atomic(user_id, wallet_type, data.amount, session=session)

        await db.goals.update_one(
            {"_id": obj_id},
            {"$set": {"current_amount": new_goal_amount}},
            session=session,
        )
        await db.transactions.insert_one({
            "user_id": user_id,
            "type": "goal_transfer",
            "amount": data.amount,
            "category": "Savings Goal",
            "wallet": wallet_type,
            "notes": f"Contribution to goal: {goal['name']}",
            "before_balance": before,
            "after_balance": after,
            "timestamp": now,
        }, session=session)
        return before, after

    _, after_bal = await run_with_transaction(_do_transfer)

    return {
        "message": "Funds added to goal",
        "current_amount": new_goal_amount,
        "target_amount": goal["target_amount"],
        "progress_pct": round((new_goal_amount / goal["target_amount"]) * 100, 1),
        "after_wallet_balance": after_bal,
    }
