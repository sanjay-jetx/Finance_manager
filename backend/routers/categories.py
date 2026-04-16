from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from database.connection import get_db
from pydantic import BaseModel, Field

router = APIRouter(prefix="/categories", tags=["Categories"])

class CategorySchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    icon: str = Field(default="📦", min_length=1, max_length=10)

DEFAULT_CATEGORIES = [
    {"name": "Food", "icon": "🍔"},
    {"name": "Gym", "icon": "🏋️"},
    {"name": "Petrol", "icon": "⛽"},
    {"name": "Snacks", "icon": "🍿"},
    {"name": "Shopping", "icon": "🛍️"},
    {"name": "Entertainment", "icon": "🎬"},
    {"name": "Health", "icon": "🏥"},
    {"name": "Other", "icon": "📦"},
]

async def ensure_default_categories(user_id: str, db):
    """If a user has no categories, seed them with defaults."""
    exists = await db.categories.find_one({"user_id": user_id})
    if not exists:
        docs = []
        for cat in DEFAULT_CATEGORIES:
            docs.append({
                "user_id": user_id,
                "name": cat["name"],
                "icon": cat["icon"],
                "is_default": True
            })
        await db.categories.insert_many(docs)

@router.get("")
async def get_categories(user_id: str = Depends(get_current_user)):
    db = get_db()
    await ensure_default_categories(user_id, db)
    cursor = db.categories.find({"user_id": user_id})
    categories = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        categories.append(doc)
    return {"categories": categories}

@router.post("")
async def add_category(data: CategorySchema, user_id: str = Depends(get_current_user)):
    db = get_db()
    # Check if exists
    existing = await db.categories.find_one({"user_id": user_id, "name": data.name})
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    cat_doc = {
        "user_id": user_id,
        "name": data.name,
        "icon": data.icon,
        "is_default": False
    }
    result = await db.categories.insert_one(cat_doc)
    return {"message": "Category added", "id": str(result.inserted_id)}

@router.delete("/{category_id}")
async def delete_category(category_id: str, user_id: str = Depends(get_current_user)):
    from bson import ObjectId
    db = get_db()
    try:
        oid = ObjectId(category_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    res = await db.categories.delete_one({"_id": oid, "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}
