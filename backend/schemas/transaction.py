from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

_MAX_INR = 1e12


class WalletType(str, Enum):
    cash = "cash"
    upi = "upi"


class ExpenseSchema(BaseModel):
    amount: float = Field(..., gt=0, le=_MAX_INR, allow_inf_nan=False)
    category: str = Field(..., min_length=1, max_length=120)
    wallet: WalletType
    notes: Optional[str] = Field(default="", max_length=500)


class IncomeSchema(BaseModel):
    amount: float = Field(..., gt=0, le=_MAX_INR, allow_inf_nan=False)
    source: str = Field(..., min_length=1, max_length=120)
    wallet: WalletType
    notes: Optional[str] = Field(default="", max_length=500)


class TransferSchema(BaseModel):
    from_wallet: WalletType
    to_wallet: WalletType
    amount: float = Field(..., gt=0, le=_MAX_INR, allow_inf_nan=False)

class UpdateTransactionSchema(BaseModel):
    amount: Optional[float] = Field(None, gt=0, le=_MAX_INR, allow_inf_nan=False)
    category: Optional[str] = Field(None, max_length=120)
    source: Optional[str] = Field(None, max_length=120)
    wallet: Optional[WalletType] = None
    notes: Optional[str] = Field(None, max_length=500)
