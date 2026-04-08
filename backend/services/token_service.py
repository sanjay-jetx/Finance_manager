"""
Token blacklist service for refresh-token revocation.

Strategy (auto-selected at startup):
  • If REDIS_URL is set → use Redis with TTL = REFRESH_TOKEN_EXPIRE_DAYS
    Advantages: survives restarts, works across multiple server instances.
  • Otherwise → in-memory set (default for local dev)
    Limitation: lost on restart; fine for single-process development.

To enable Redis in production:
    REDIS_URL=redis://localhost:6379/0   (add to backend/.env)
"""

import os
from logging_config import get_logger

logger = get_logger(__name__)

_REDIS_URL = os.getenv("REDIS_URL", "")
_REFRESH_TTL_SECONDS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7)) * 24 * 3600

# ── Backend selection ─────────────────────────────────────────────────────────

_redis_client = None

if _REDIS_URL:
    try:
        import redis as _redis_lib
        _redis_client = _redis_lib.from_url(_REDIS_URL, decode_responses=True)
        _redis_client.ping()   # fail fast if URL is wrong
        logger.info("Token blacklist: using Redis at %s", _REDIS_URL.split("@")[-1])
    except Exception as e:
        logger.warning("Redis unavailable (%s) — falling back to in-memory blacklist", e)
        _redis_client = None
else:
    logger.info("Token blacklist: using in-memory store (set REDIS_URL for persistence)")

# Fallback in-memory store
_blacklisted_jtis: set[str] = set()

# ── Public API ───────────────────────────────────────────────────────────────

def blacklist_token(jti: str) -> None:
    """Add a token's JTI to the blacklist (called on logout)."""
    if _redis_client:
        try:
            _redis_client.setex(f"bl:{jti}", _REFRESH_TTL_SECONDS, "1")
            logger.info("Token blacklisted (Redis): jti=%s", jti[:8] + "...")
            return
        except Exception as e:
            logger.warning("Redis write failed, using in-memory fallback: %s", e)
    _blacklisted_jtis.add(jti)
    logger.info("Token blacklisted (memory): jti=%s", jti[:8] + "...")


def is_blacklisted(jti: str) -> bool:
    """Check whether a token has been revoked."""
    if _redis_client:
        try:
            return bool(_redis_client.exists(f"bl:{jti}"))
        except Exception as e:
            logger.warning("Redis read failed, using in-memory fallback: %s", e)
    return jti in _blacklisted_jtis
