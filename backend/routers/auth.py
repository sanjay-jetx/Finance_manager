"""
Authentication router — signup, login, Google OAuth, token refresh, logout.

Rate limits:
  - /auth/signup:  3 requests/minute per IP
  - /auth/login:   5 requests/minute per IP
  - /auth/google:  5 requests/minute per IP
  - /auth/refresh: 10 requests/minute per IP
"""

from fastapi import APIRouter, HTTPException, Request, Response
from slowapi import Limiter
from slowapi.util import get_remote_address

from schemas.auth import SignupSchema, LoginSchema, GoogleAuthSchema, TokenSchema
from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    verify_google_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from services.token_service import blacklist_token
from services.wallet_service import get_or_create_wallet
from database.connection import get_db
from logging_config import get_logger

logger = get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["Auth"])

# ── Cookie Config ───────────────────────────────────────────────────────────

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days in seconds


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Set the refresh token as an HTTP-only secure cookie."""
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,       # JavaScript cannot read this cookie
        secure=False,        # Set to True in production (HTTPS only)
        samesite="lax",      # CSRF protection
        max_age=REFRESH_COOKIE_MAX_AGE,
        path="/auth",        # Cookie only sent to /auth/* endpoints
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Clear the refresh token cookie."""
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        httponly=True,
        secure=False,        # Must match set_cookie settings
        samesite="lax",
        path="/auth",
    )


# ── Signup ──────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=TokenSchema)
@limiter.limit("3/minute")
async def signup(data: SignupSchema, request: Request, response: Response):
    try:
        db = get_db()
        existing = await db.users.find_one({"email": data.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        user_doc = {
            "name": data.name,
            "email": data.email,
            "hashed_password": hash_password(data.password),
            "auth_provider": "email",
        }
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)

        # Auto-create wallet for new user
        await get_or_create_wallet(user_id, data.email)

        token_data = {"sub": user_id, "email": data.email}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        _set_refresh_cookie(response, refresh_token)
        logger.info("New user signed up: %s", data.email)

        return TokenSchema(
            access_token=access_token,
            user_name=data.name,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Signup error for %s: %s", data.email, type(e).__name__)
        raise HTTPException(status_code=500, detail="Internal server error during signup")


# ── Login ───────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenSchema)
@limiter.limit("5/minute")
async def login(data: LoginSchema, request: Request, response: Response):
    try:
        db = get_db()
        user = await db.users.find_one({"email": data.email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Block Google-only accounts from password login
        if not user.get("hashed_password"):
            raise HTTPException(
                status_code=400,
                detail="This account uses Google Sign-In. Please use Google Login.",
            )

        if not verify_password(data.password, user["hashed_password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user_id = str(user["_id"])
        # Ensure wallet exists (in case of legacy accounts)
        await get_or_create_wallet(user_id, data.email)

        token_data = {"sub": user_id, "email": data.email}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        _set_refresh_cookie(response, refresh_token)
        logger.info("User logged in: %s", data.email)

        return TokenSchema(
            access_token=access_token,
            user_name=user["name"],
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Login error for %s: %s", data.email, type(e).__name__)
        raise HTTPException(status_code=500, detail="Internal server error during login")


# ── Google OAuth Login ──────────────────────────────────────────────────────

@router.post("/google", response_model=TokenSchema)
@limiter.limit("5/minute")
async def google_login(data: GoogleAuthSchema, request: Request, response: Response):
    """Verify a Google ID token, create/find user, return JWT."""
    try:
        google_info = verify_google_token(data.token)
        if not google_info:
            raise HTTPException(status_code=401, detail="Invalid Google token")

        email = google_info["email"]
        name = google_info["name"]
        google_id = google_info["google_id"]

        db = get_db()
        user = await db.users.find_one({"email": email})

        if not user:
            # First-time Google login — create account + wallet
            user_doc = {
                "name": name,
                "email": email,
                "google_id": google_id,
                "hashed_password": None,  # No password for Google users
                "auth_provider": "google",
            }
            result = await db.users.insert_one(user_doc)
            user_id = str(result.inserted_id)
            await get_or_create_wallet(user_id, email)
            logger.info("New Google user created: %s", email)
        else:
            user_id = str(user["_id"])
            # Link Google ID to existing email-registered account
            if not user.get("google_id"):
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"google_id": google_id, "auth_provider": "google"}},
                )
                logger.info("Linked Google ID to existing account: %s", email)
            # Ensure wallet exists for existing users
            await get_or_create_wallet(user_id, email)

        token_data = {"sub": user_id, "email": email}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        _set_refresh_cookie(response, refresh_token)

        return TokenSchema(
            access_token=access_token,
            user_name=name,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Google login error: %s", type(e).__name__)
        raise HTTPException(status_code=500, detail="Internal server error during google login")


# ── Token Refresh ───────────────────────────────────────────────────────────

@router.post("/refresh")
@limiter.limit("10/minute")
async def refresh_access_token(request: Request, response: Response):
    """Exchange a valid refresh token (from HTTP-only cookie) for a new access token."""
    refresh = request.cookies.get(REFRESH_COOKIE_NAME)
    if not refresh:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    payload = decode_refresh_token(refresh)
    if not payload:
        _clear_refresh_cookie(response)
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user_id = payload.get("sub")
    email = payload.get("email")
    if not user_id:
        raise HTTPException(status_code=401, detail="Malformed refresh token")

    new_access = create_access_token({"sub": user_id, "email": email})

    return {
        "access_token": new_access,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


# ── Logout ──────────────────────────────────────────────────────────────────

@router.post("/logout")
async def logout(request: Request, response: Response):
    """Clear refresh token cookie and blacklist the token's JTI."""
    refresh = request.cookies.get(REFRESH_COOKIE_NAME)
    if refresh:
        payload = decode_refresh_token(refresh)
        if payload and payload.get("jti"):
            blacklist_token(payload["jti"])

    _clear_refresh_cookie(response)
    logger.info("User logged out")

    return {"message": "Logged out successfully"}
