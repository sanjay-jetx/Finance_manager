from fastapi import APIRouter, Depends
from dependencies import get_current_user
from database.connection import get_db
from schemas.budget import BudgetSchema
from datetime import datetime, timezone

router = APIRouter(tags=["Budgets"])


@router.post("/budgets")
async def create_or_update_budget(
    data: BudgetSchema, user_id: str = Depends(get_current_user)
):
    db = get_db()
    budget_doc = {
        "user_id": user_id,
        "category": data.category,
        "limit": data.limit,
        "updated_at": datetime.now(timezone.utc),
    }
    await db.budgets.update_one(
        {"user_id": user_id, "category": data.category},
        {"$set": budget_doc},
        upsert=True,
    )
    return {"message": "Budget created/updated successfully"}


@router.get("/budgets")
async def get_budgets(user_id: str = Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc)
    start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

    # Aggregate spending per category this month
    pipeline = [
        {"$match": {
            "user_id": user_id,
            "type": "expense",
            "timestamp": {"$gte": start_of_month},
        }},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
    ]
    spent_cursor = db.transactions.aggregate(pipeline)
    spent_dict = {}
    async for item in spent_cursor:
        spent_dict[item["_id"]] = item["total"]

    cursor = db.budgets.find({"user_id": user_id})
    budgets = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if doc.get("updated_at"):
            doc["updated_at"] = doc["updated_at"].isoformat()
        doc["spent"] = spent_dict.get(doc["category"], 0.0)
        budgets.append(doc)

    return {"budgets": budgets, "count": len(budgets)}
