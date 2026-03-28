"""
Shared FastAPI dependencies — authentication middleware.
Import get_current_user in every protected router.
"""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.auth_service import decode_access_token

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    Extract and validate the JWT access token, returning the user_id (sub) string.
    
    Specifically validates that the token is an ACCESS token (not a refresh token),
    preventing token confusion attacks.
    """
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing user identifier")
    return user_id
