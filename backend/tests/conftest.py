import pytest
import asyncio
from mongomock_motor import AsyncMongoMockClient
import database.connection as db_conn

# ── Mocking the DB ─────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def mock_db_connection():
    """
    Automatically mock the database connection for ALL tests.
    This prevents tests from accidentally hitting the real MongoDB.
    """
    mock_client = AsyncMongoMockClient()
    mock_db = mock_client["test_db"]
    
    # Monkey-patch the global variables in database.connection
    db_conn.client = mock_client
    db_conn.db = mock_db
    
    return mock_db
