from fastapi import APIRouter, Depends
from dependencies import get_current_user
from services.wallet_service import get_or_create_wallet

router = APIRouter(tags=["Wallets"])


@router.get("/balances")
async def get_balances(user_id: str = Depends(get_current_user)):
    wallet = await get_or_create_wallet(user_id)
    cash = wallet.get("cash_balance", 0.0)
    upi = wallet.get("upi_balance", 0.0)
    return {
        "cash_balance": cash,
        "upi_balance": upi,
        "total_balance": round(cash + upi, 2),
    }
