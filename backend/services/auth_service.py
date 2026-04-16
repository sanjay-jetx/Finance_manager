"""
Authentication service — password hashing, JWT dual-token system, Google OAuth.

Security notes:
- Access tokens are short-lived (15 min default) and carry type="access"
- Refresh tokens are long-lived (7 days default) with type="refresh" and a unique jti
- Separate secrets for access vs refresh tokens (defense in depth)
- Google OAuth verifies email_verified claim
"""

import uuid
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import os
from typing import cast

from logging_config import get_logger
from services.token_service import is_blacklisted

logger = get_logger(__name__)

load_dotenv()

# ── Secrets & Config ────────────────────────────────────────────────────────

SECRET_KEY = cast(str, os.getenv("SECRET_KEY"))
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY environment variable is not set! "
        "Add it to backend/.env before starting the server."
    )

REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", SECRET_KEY)
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# Lazily initialised in verify_google_token() to avoid importing google-auth at startup
_google_request_session = None


# ── Password Hashing ───────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt + random salt (optimized for speed)."""
    salt = bcrypt.gensalt(rounds=8)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# ── JWT Token Creation ──────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    """Create a short-lived access token with type='access'."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a long-lived refresh token with type='refresh' and a unique jti."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({
        "exp": expire,
        "type": "refresh",
        "jti": str(uuid.uuid4()),  # Unique ID for revocation
    })
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)


# ── JWT Token Decoding ──────────────────────────────────────────────────────

def decode_access_token(token: str) -> dict | None:
    """Decode and validate an access token. Returns payload or None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            logger.warning("Token type mismatch: expected 'access', got '%s'", payload.get("type"))
            return None
        return payload
    except JWTError:
        return None


def decode_refresh_token(token: str) -> dict | None:
    """Decode and validate a refresh token. Checks blacklist. Returns payload or None."""
    try:
        payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            logger.warning("Token type mismatch: expected 'refresh', got '%s'", payload.get("type"))
            return None
        # Check if this specific token has been revoked (logout)
        jti = payload.get("jti")
        if jti and is_blacklisted(jti):
            logger.warning("Attempted use of blacklisted refresh token: jti=%s", jti[:8] + "...")
            return None
        return payload
    except JWTError:
        return None


# Legacy alias — kept for backward compatibility with dependencies.py
decode_token = decode_access_token


# ── Google OAuth ────────────────────────────────────────────────────────────

def verify_google_token(id_token_value: str) -> dict | None:
    """
    Verify a Google ID token and return user info.
    Returns dict with email, name, google_id or None on failure.
    """
    try:
        if not GOOGLE_CLIENT_ID:
            logger.error("GOOGLE_CLIENT_ID is not set in .env")
            raise RuntimeError("GOOGLE_CLIENT_ID is not set in .env")
            
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
        
        # Cache the HTTP session globally to prevent re-fetching certs on every call
        global _google_request_session
        if _google_request_session is None:
            _google_request_session = google_requests.Request()

        id_info = google_id_token.verify_oauth2_token(
            id_token_value,
            _google_request_session,
            GOOGLE_CLIENT_ID,
        )

        # Security: Reject tokens for unverified email addresses
        if not id_info.get("email_verified", False):
            logger.warning("Google token rejected: email not verified for %s", id_info.get("email"))
            return None

        return {
            "email": id_info["email"],
            "name": id_info.get("name", id_info["email"].split("@")[0]),
            "google_id": id_info["sub"],
        }
    except ValueError as e:
        # ValueError is raised for invalid/expired Google tokens
        logger.warning("Google token verification failed (invalid token): %s", e)
        return None
    except Exception as e:
        logger.error("Google token verification error: %s", type(e).__name__)
        return None
