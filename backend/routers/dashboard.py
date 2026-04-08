from fastapi import APIRouter, Depends
from dependencies import get_current_user
from services.wallet_service import get_or_create_wallet
from database.connection import get_db
from datetime import datetime, timedelta, timezone
from routers.metals import get_portfolio

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard")
async def get_dashboard(user_id: str = Depends(get_current_user)):
    db = get_db()

    # Wallet balances
    wallet = await get_or_create_wallet(user_id)
    cash_balance = wallet.get("cash_balance", 0.0)
    upi_balance  = wallet.get("upi_balance", 0.0)
    total_balance = round(cash_balance + upi_balance, 2)

    # Pending receivables
    pending_amount = 0.0
    pending_count  = 0
    async for row in db.debts.find({"user_id": user_id, "status": "pending"}):
        pending_amount += row["amount"]
        pending_count  += 1

    try:
        metals_data = await get_portfolio(user_id=user_id)
        metals_value = metals_data.get("total_value", 0.0)
    except Exception:
        metals_value = 0.0

    net_worth = round(total_balance + pending_amount + metals_value, 2)

    # This month
    now = datetime.now(timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

    async def _sum(pipeline):
        result = await db.transactions.aggregate(pipeline).to_list(1)
        return result[0]["total"] if result else 0.0

    monthly_expense = await _sum([
        {"$match": {"user_id": user_id, "type": "expense", "timestamp": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ])
    monthly_income = await _sum([
        {"$match": {"user_id": user_id, "type": "income", "timestamp": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ])

    # Savings rate %
    savings_rate = 0.0
    if monthly_income > 0:
        savings_rate = round(((monthly_income - monthly_expense) / monthly_income) * 100, 1)

    # Today's spending
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    today_spending = await _sum([
        {"$match": {"user_id": user_id, "type": "expense", "timestamp": {"$gte": today_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ])

    # Weekly spending (last 7 days)
    week_data = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        day_end   = day_start + timedelta(days=1)
        total = await _sum([
            {"$match": {"user_id": user_id, "type": "expense",
                        "timestamp": {"$gte": day_start, "$lt": day_end}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ])
        week_data.append({"day": day.strftime("%a"), "date": day.strftime("%d %b"), "amount": total})

    # Category breakdown (top 6 this month)
    cat_result = await db.transactions.aggregate([
        {"$match": {"user_id": user_id, "type": "expense", "timestamp": {"$gte": month_start}}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
        {"$sort": {"total": -1}},
        {"$limit": 6},
    ]).to_list(6)
    categories  = [{"category": r["_id"], "amount": r["total"]} for r in cat_result]
    top_category = cat_result[0]["_id"] if cat_result else None

    # Recent 5 transactions
    recent = []
    async for doc in db.transactions.find({"user_id": user_id}).sort("timestamp", -1).limit(5):
        doc["_id"]       = str(doc["_id"])
        doc["timestamp"] = doc["timestamp"].isoformat() if doc.get("timestamp") else None
        recent.append(doc)

    # Budgets
    from routers.budgets import get_budgets
    budget_res = await get_budgets(user_id=user_id)
    budgets = budget_res.get("budgets", [])

    # Budget alerts — any category over 80%
    budget_alerts = [
        b["category"] for b in budgets
        if b.get("limit", 0) > 0 and (b.get("spent", 0) / b["limit"]) >= 0.8
    ]

    return {
        "cash_balance":              cash_balance,
        "upi_balance":               upi_balance,
        "total_balance":             total_balance,
        "net_worth":                 net_worth,
        "pending_amount":            round(pending_amount, 2),
        "pending_receivables_count": pending_count,
        "monthly_expense":           round(monthly_expense, 2),
        "monthly_income":            round(monthly_income, 2),
        "savings_rate":              savings_rate,
        "today_spending":            round(today_spending, 2),
        "top_category":              top_category,
        "weekly_spending":           week_data,
        "category_breakdown":        categories,
        "recent_transactions":       recent,
        "budgets":                   budgets,
        "budget_alerts":             budget_alerts,
    }
