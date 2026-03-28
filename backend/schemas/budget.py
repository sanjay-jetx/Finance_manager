from pydantic import BaseModel

class BudgetSchema(BaseModel):
    category: str
    limit: float
