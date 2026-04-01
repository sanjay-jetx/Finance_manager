"""
pytest configuration for the Finance App backend test suite.

Uses mongomock-motor to patch the real AsyncIOMotorClient with an in-memory
MongoDB mock — tests run fully offline without any live database connection.

Each test gets a FRESH database (autouse + function scope) so data from
one test never leaks into another.
"""

import asyncio
import pytest
import pytest_asyncio
from mongomock_motor import AsyncMongoMockClient

import database.connection as db_conn


# ── Event Loop ────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def event_loop():
    """Single event loop shared across the whole test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ── In-Memory DB Fixture ──────────────────────────────────────────────────────

@pytest_asyncio.fixture(autouse=True)
async def mock_db():
    """
    Patch the global Motor client/db with a fresh in-memory mock before every
    test, then drop all collections afterwards for full isolation.
    `autouse=True` means every test in this folder gets it automatically.
    """
    mock_client = AsyncMongoMockClient()
    mock_database = mock_client["finance_app_test"]

    # Monkey-patch the module-level globals used by get_db() / get_client()
    db_conn.client = mock_client
    db_conn.db = mock_database

    yield mock_database

    # Teardown: wipe all collections so tests don't bleed into each other
    for col_name in await mock_database.list_collection_names():
        await mock_database.drop_collection(col_name)
