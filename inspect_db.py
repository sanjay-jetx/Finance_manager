import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_data():
    try:
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        db = client["finance_app"]
        
        # Test connection
        await client.admin.command('ping')
        print("[OK] Connected to MongoDB")

        # 1. Check User (search for sanjay)
        user = await db.users.find_one({"name": {"$regex": "sanjay", "$options": "i"}})
        if not user:
            user = await db.users.find_one() # Get any user if sanjay not found
        
        if user:
            user_id = str(user["_id"])
            print(f"User found: {user.get('name')} (ID: {user_id})")
            
            # 2. Check Wallet
            wallet = await db.wallets.find_one({"user_id": user_id})
            print(f"Wallet: {wallet}")
            
            # 3. Check Debts (Receivables)
            debts = await db.debts.find({"user_id": user_id, "status": "pending"}).to_list(100)
            print(f"Pending Debts Count: {len(debts)}")
            for d in debts:
                print(f" - Debt: {d.get('description')} | Amount: {d.get('amount')}")
                
            # 4. Check Metals
            metals = await db.metal_holdings.find_one({"user_id": user_id})
            print(f"Metal Holdings: {metals}")
            
            # 5. Check Metal Rates
            rates = await db.metal_rates.find_one({"_id": "global"})
            print(f"Metal Rates: {rates}")
            
        else:
            print("No user found in DB")
    except Exception as e:
        print(f"[ERROR] {e}")

if __name__ == "__main__":
    asyncio.run(check_data())
