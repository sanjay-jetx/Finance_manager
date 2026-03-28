import re
from pydantic import BaseModel, EmailStr, field_validator


class SignupSchema(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthSchema(BaseModel):
    token: str  # Google ID token from @react-oauth/google


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str
    expires_in: int  # Seconds until access token expires
