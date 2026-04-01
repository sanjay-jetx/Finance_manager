from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from dependencies import get_current_user
from database.connection import get_db
from datetime import datetime, timezone
from bson import ObjectId

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

class SubSchema(BaseModel):
    name: str
    amount: float = Field(..., gt=0)
    billing_cycle: str = "monthly"  # monthly, yearly, weekly
    category: str = "Entertainment"
    next_billing_date: str = None   # ISO string


@router.get("/")
async def get_subs(user_id: str = Depends(get_current_user)):
    db = get_db()
    cursor = db.subscriptions.find({"user_id": user_id})
    subs = []
    
    total_monthly = 0.0
    
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        subs.append(doc)
        
        # Calculate monthly equivalent
        if doc.get("is_active", True):
            amt = doc["amount"]
            cycle = doc.get("billing_cycle", "monthly")
            if cycle == "yearly":
                total_monthly += (amt / 12)
            elif cycle == "weekly":
                total_monthly += (amt * 4.33)
            else:
                total_monthly += amt

    # Sort so active is first, then by amount descending
    subs = sorted(subs, key=lambda x: (not x.get("is_active", True), -x["amount"]))

    return {
        "subscriptions": subs,
        "total_monthly_fixed": round(total_monthly, 2)
    }


@router.post("/")
async def create_sub(data: SubSchema, user_id: str = Depends(get_current_user)):
    db = get_db()
    
    doc = {
        "user_id": user_id,
        "name": data.name,
        "amount": data.amount,
        "billing_cycle": data.billing_cycle,
        "category": data.category,
        "next_billing_date": data.next_billing_date,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }
    
    res = await db.subscriptions.insert_one(doc)
    return {"message": "Subscription added", "id": str(res.inserted_id)}


@router.patch("/{sub_id}/toggle")
async def toggle_sub(sub_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    try:
        obj_id = ObjectId(sub_id)
    except:
        raise HTTPException(400, "Invalid ID")
        
    sub = await db.subscriptions.find_one({"_id": obj_id, "user_id": user_id})
    if not sub:
        raise HTTPException(404, "Not found")

    new_state = not sub.get("is_active", True)
    await db.subscriptions.update_one(
        {"_id": obj_id}, 
        {"$set": {"is_active": new_state}}
    )
    
    return {"message": "Subscription toggled", "is_active": new_state}


@router.delete("/{sub_id}")
async def delete_sub(sub_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    try:
        obj_id = ObjectId(sub_id)
    except:
        raise HTTPException(400, "Invalid ID")
        
    res = await db.subscriptions.delete_one({"_id": obj_id, "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Not found")
        
    return {"message": "Subscription deleted"}
