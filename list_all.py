import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load env from backend folder
load_dotenv("backend/.env")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

async def list_all():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client["finance_app"]
    
    users = await db.users.find().to_list(100)
    print(f"Total Users Found: {len(users)}")
    for i, u in enumerate(users):
        uid = str(u["_id"])
        wallet = await db.wallets.find_one({"user_id": uid})
        is_match = False
        if wallet and wallet.get("cash_balance") == 105 and wallet.get("upi_balance") == 115:
            is_match = True
            print(f"!!! EXACT WALLET MATCH FOUND !!!")
        
        debts = await db.debts.find({"user_id": uid, "status": "pending"}).to_list(100)
        metals = await db.metal_holdings.find_one({"user_id": uid})
        
        print(f"USER {i}: {u.get('name')} | EMAIL: {u.get('email')} | ID: {uid}")
        if is_match or True: # Print anyway for now
            print(f"  WALLET: {wallet}")
            print(f"  METALS: {metals}")
            print(f"  PENDING DEBTS: {len(debts)}")
        print("-" * 40)
        
        if metals:
            # Check rates to see value
            rates = await db.metal_rates.find_one({"_id": "global"})
            if rates:
                gold_rate = rates.get("gold_24k_per_gram", 0)
                silver_rate = rates.get("silver_per_gram", 0)
                # purity etc skipped for brevity
                val = (metals.get("gold_grams", 0) * gold_rate) + (metals.get("silver_grams", 0) * silver_rate)
                print(f"  Estimated Metal Value: {val}")

if __name__ == "__main__":
    asyncio.run(list_all())
