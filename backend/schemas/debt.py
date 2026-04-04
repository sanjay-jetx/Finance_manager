from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from schemas.transaction import WalletType

_MAX_INR = 1e12  # sane upper bound; rejects garbage / overflow-ish payloads


class LendSchema(BaseModel):
    person_name: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0, le=_MAX_INR, allow_inf_nan=False)
    wallet: WalletType
    notes: Optional[str] = Field(default="", max_length=500)
    return_date: Optional[date] = None
    no_debit: Optional[bool] = False


class ReturnSchema(BaseModel):
    wallet: WalletType

class UpdateDebtSchema(BaseModel):
    person_name: Optional[str] = Field(None, min_length=1, max_length=200)
    amount: Optional[float] = Field(None, gt=0, le=_MAX_INR, allow_inf_nan=False)
    wallet: Optional[WalletType] = None
    notes: Optional[str] = Field(None, max_length=500)
    return_date: Optional[date] = None
    no_debit: Optional[bool] = None  # when True → record as already paid (no wallet deduction)
