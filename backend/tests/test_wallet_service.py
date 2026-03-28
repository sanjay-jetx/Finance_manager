import pytest
from services.wallet_service import (
    get_or_create_wallet,
    credit_wallet_atomic,
    debit_wallet_atomic,
    transfer_wallet_atomic,
)
from fastapi import HTTPException

# Mark all tests in this file as async (using pytest-asyncio)
pytestmark = pytest.mark.asyncio


async def test_create_and_fetch_wallet():
    """Verify that a wallet is created if it doesn't exist."""
    user_id = "test_user_1"
    email = "user1@example.com"
    
    # 1. Create it
    wallet = await get_or_create_wallet(user_id, email)
    assert wallet["user_id"] == user_id
    assert wallet["cash_balance"] == 0.0
    assert wallet["upi_balance"] == 0.0
    
    # 2. Fetch it again (should return existing one)
    wallet2 = await get_or_create_wallet(user_id)
    assert str(wallet["_id"]) == str(wallet2["_id"])


async def test_atomic_balance_updates():
    """Verify $inc and insufficient balance guards."""
    user_id = "test_user_2"
    await get_or_create_wallet(user_id)
    
    # 1. Credit 1000 to Cash
    before, after = await credit_wallet_atomic(user_id, "cash", 1000.0)
    assert before == 0.0
    assert after == 1000.0
    
    # 2. Debit 400 from Cash (Success)
    before, after = await debit_wallet_atomic(user_id, "cash", 400.0)
    assert before == 1000.0
    assert after == 600.0
    
    # 3. Debit 700 from Cash (Insufficient)
    with pytest.raises(HTTPException) as exc:
        await debit_wallet_atomic(user_id, "cash", 700.0)
    assert exc.value.status_code == 400
    assert "Insufficient" in exc.value.detail


async def test_atomic_transfer():
    """Ensure money moves correctly between Cash and UPI."""
    user_id = "test_user_3"
    await get_or_create_wallet(user_id)
    
    # Seed 500 into UPI
    await credit_wallet_atomic(user_id, "upi", 500.0)
    
    # Transfer 200 from UPI to Cash
    # Result: UPI=300, Cash=200
    bf, af, bt, at = await transfer_wallet_atomic(user_id, "upi", "cash", 200.0)
    
    assert bf == 500.0
    assert af == 300.0
    assert bt == 0.0
    assert at == 200.0
    
    # Transfer 400 from UPI (Should fail)
    with pytest.raises(HTTPException):
        await transfer_wallet_atomic(user_id, "upi", "cash", 400.0)


async def test_transfer_to_same_wallet():
    """Ensure transferring to the same wallet throws an error."""
    user_id = "test_user_4"
    await get_or_create_wallet(user_id)
    
    with pytest.raises(HTTPException) as exc:
        await transfer_wallet_atomic(user_id, "cash", "cash", 100.0)
    assert exc.value.status_code == 400
    assert "same wallet" in exc.value.detail
