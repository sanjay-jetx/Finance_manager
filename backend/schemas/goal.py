from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from schemas.transaction import WalletType


class GoalSchema(BaseModel):
    name: str
    target_amount: float
    deadline: Optional[datetime] = None


class AddFundsSchema(BaseModel):
    amount: float
    wallet: WalletType
