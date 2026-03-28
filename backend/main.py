from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from database.connection import connect_db, close_db
from logging_config import setup_logging, get_logger
from routers import auth, transactions, debts, wallets, dashboard, goals, budgets

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown lifecycle."""
    setup_logging()
    logger.info("Starting FinTrack API...")
    await connect_db()
    yield
    await close_db()
    logger.info("FinTrack API stopped.")


app = FastAPI(
    title="💰 FinTrack Personal Finance API",
    description="Secure JWT-authenticated API for cash/UPI wallets, income, expenses, and receivables (money you lent).",
    version="2.0.0",
    lifespan=lifespan,
)

# ── Rate Limiting ───────────────────────────────────────────────────────────
# SlowAPI reads limiter instances from the route decorators in routers/auth.py
# This handler returns a proper 429 JSON response instead of a raw error.
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS — allow React frontend on dev ports ───────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,  # Required for HTTP-only cookies (refresh tokens)
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes: /auth/signup, /auth/login, /auth/google, /auth/refresh, /auth/logout
app.include_router(auth.router)

# Feature routes (JWT protected)
app.include_router(transactions.router)
app.include_router(debts.router)
app.include_router(wallets.router)
app.include_router(dashboard.router)
app.include_router(goals.router)
app.include_router(budgets.router)


@app.get("/")
async def root():
    return {
        "message": "💰 FinTrack API v2.0 is running!",
        "docs": "/docs",
        "auth_routes": ["/auth/signup", "/auth/login", "/auth/google", "/auth/refresh", "/auth/logout"],
    }
