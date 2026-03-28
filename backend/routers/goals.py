from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from services.wallet_service import get_balance, update_balance, get_or_create_wallet
from database.connection import get_db
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
    before_bal = await get_balance(user_id, wallet_type)

    if before_bal < data.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient {wallet_type} balance (have ₹{before_bal:.2f})"
        )

    after_bal = round(before_bal - data.amount, 2)
    await update_balance(user_id, wallet_type, after_bal)

    new_goal_amount = round(goal.get("current_amount", 0.0) + data.amount, 2)
    await db.goals.update_one({"_id": obj_id}, {"$set": {"current_amount": new_goal_amount}})

    txn = {
        "user_id": user_id,
        "type": "goal_transfer",
        "amount": data.amount,
        "category": "Savings Goal",
        "wallet": wallet_type,
        "notes": f"Contribution to goal: {goal['name']}",
        "before_balance": before_bal,
        "after_balance": after_bal,
        "timestamp": datetime.now(timezone.utc),
    }
    await db.transactions.insert_one(txn)

    return {
        "message": "Funds added to goal",
        "current_amount": new_goal_amount,
        "target_amount": goal["target_amount"],
        "progress_pct": round((new_goal_amount / goal["target_amount"]) * 100, 1),
        "after_wallet_balance": after_bal,
    }
