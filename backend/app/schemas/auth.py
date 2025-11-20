"""Authentication schemas."""

from pydantic import BaseModel


class Token(BaseModel):
    """OAuth2 token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """JWT token payload."""

    sub: int  # User ID
    exp: int  # Expiration timestamp
    jti: str | None = None  # JWT ID (for blacklisting)


class LoginRequest(BaseModel):
    """Login request schema."""

    email: str
    password: str


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""

    refresh_token: str
