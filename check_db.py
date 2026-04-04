import asyncio
import pprint
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['finance_app']
    list_t = await db.transactions.find().to_list(100)
    print("TRANSACTIONS:")
    pprint.pprint([{k:v for k,v in i.items() if k!='_id'} for i in list_t])

    list_d = await db.debts.find().to_list(100)
    print("DEBTS:")
    pprint.pprint([{k:v for k,v in i.items() if k!='_id'} for i in list_d])

asyncio.run(main())
