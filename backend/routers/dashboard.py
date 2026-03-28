from fastapi import APIRouter, Depends
from dependencies import get_current_user
from services.wallet_service import get_or_create_wallet
from database.connection import get_db
from datetime import datetime, timedelta, timezone

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard")
async def get_dashboard(user_id: str = Depends(get_current_user)):
    db = get_db()

    # Wallet balances — auto-create if missing
    wallet = await get_or_create_wallet(user_id)
    cash_balance = wallet.get("cash_balance", 0.0)
    upi_balance = wallet.get("upi_balance", 0.0)
    total_balance = round(cash_balance + upi_balance, 2)

    # Money others still owe you (outstanding receivables — same `debts` collection)
    pending_receivables_cursor = db.debts.find({"user_id": user_id, "status": "pending"})
    pending_amount = 0.0
    pending_count = 0
    async for row in pending_receivables_cursor:
        pending_amount += row["amount"]
        pending_count += 1

    # This month's expenses and income
    now = datetime.now(timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

    pipeline_expense = [
        {"$match": {"user_id": user_id, "type": "expense", "timestamp": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    pipeline_income = [
        {"$match": {"user_id": user_id, "type": "income", "timestamp": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]

    expense_result = await db.transactions.aggregate(pipeline_expense).to_list(1)
    income_result = await db.transactions.aggregate(pipeline_income).to_list(1)

    monthly_expense = expense_result[0]["total"] if expense_result else 0.0
    monthly_income = income_result[0]["total"] if income_result else 0.0

    # Weekly spending (last 7 days)
    week_data = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        pipe = [
            {"$match": {
                "user_id": user_id,
                "type": "expense",
                "timestamp": {"$gte": day_start, "$lt": day_end},
            }},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]
        result = await db.transactions.aggregate(pipe).to_list(1)
        week_data.append({
            "day": day.strftime("%a"),
            "date": day.strftime("%d %b"),
            "amount": result[0]["total"] if result else 0.0,
        })

    # Category breakdown (top 6 this month)
    cat_pipeline = [
        {"$match": {"user_id": user_id, "type": "expense", "timestamp": {"$gte": month_start}}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
        {"$sort": {"total": -1}},
        {"$limit": 6},
    ]
    cat_result = await db.transactions.aggregate(cat_pipeline).to_list(6)
    categories = [{"category": r["_id"], "amount": r["total"]} for r in cat_result]

    # Recent transactions (last 5)
    recent_cursor = db.transactions.find({"user_id": user_id}).sort("timestamp", -1).limit(5)
    recent = []
    async for doc in recent_cursor:
        doc["_id"] = str(doc["_id"])
        doc["timestamp"] = doc["timestamp"].isoformat() if doc.get("timestamp") else None
        recent.append(doc)
    
    # Get budgets for dashboard display
    from routers.budgets import get_budgets
    budget_res = await get_budgets(user_id=user_id)
    budgets = budget_res.get("budgets", [])

    return {
        "cash_balance": cash_balance,
        "upi_balance": upi_balance,
        "total_balance": total_balance,
        "pending_amount": round(pending_amount, 2),
        "pending_debts_count": pending_count,
        "pending_receivables_count": pending_count,
        "monthly_expense": round(monthly_expense, 2),
        "monthly_income": round(monthly_income, 2),
        "weekly_spending": week_data,
        "category_breakdown": categories,
        "recent_transactions": recent,
        "budgets": budgets,
    }
