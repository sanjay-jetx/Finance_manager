"""
Token blacklist service for refresh-token revocation.

Uses an in-memory set of JTI (JWT ID) values.
For multi-instance production deployments, swap this for a Redis-backed store.
"""

from logging_config import get_logger

logger = get_logger(__name__)

# In-memory blacklist — survives for the lifetime of the process
_blacklisted_jtis: set[str] = set()


def blacklist_token(jti: str) -> None:
    """Add a token's JTI to the blacklist (called on logout)."""
    _blacklisted_jtis.add(jti)
    logger.info("Token blacklisted: jti=%s", jti[:8] + "...")


def is_blacklisted(jti: str) -> bool:
    """Check whether a token has been revoked."""
    return jti in _blacklisted_jtis
