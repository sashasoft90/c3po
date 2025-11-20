"""Security utilities for authentication and authorization."""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.redis import cache_exists
from app.schemas.auth import TokenPayload

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def create_access_token(
    subject: int | str, expires_delta: timedelta | None = None, jti: str | None = None
) -> str:
    """
    Create JWT access token.

    Args:
        subject: User ID or other identifier
        expires_delta: Token expiration time (default: from settings)
        jti: JWT ID for token blacklisting (optional)

    Returns:
        Encoded JWT token
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {"exp": expire, "sub": str(subject)}

    if jti:
        to_encode["jti"] = jti

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(subject: int | str) -> tuple[str, str]:
    """
    Create refresh token (just a UUID stored in Redis).

    Args:
        subject: User ID

    Returns:
        Tuple of (token, token_id)
    """
    token_id = str(uuid.uuid4())
    expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    expire = datetime.now(timezone.utc) + expires_delta

    # Store token in Redis with expiration
    # Format: refresh_token:{token_id} -> user_id
    # This is handled in the auth endpoint

    return token_id, str(subject)


async def verify_token(token: str) -> TokenPayload:
    """
    Verify and decode JWT token.

    Args:
        token: JWT token string

    Returns:
        Token payload

    Raises:
        HTTPException: If token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str | None = payload.get("sub")
        jti: str | None = payload.get("jti")

        if user_id is None:
            raise credentials_exception

        # Check if token is blacklisted
        if jti and await cache_exists(f"token:blacklist:{jti}"):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked")

        token_data = TokenPayload(sub=int(user_id), exp=payload["exp"], jti=jti)
    except JWTError:
        raise credentials_exception
    except (KeyError, ValueError):
        raise credentials_exception

    return token_data


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    """
    Get current authenticated user from JWT token.

    Args:
        token: JWT token from Authorization header
        db: Database session

    Returns:
        Current user

    Raises:
        HTTPException: If user not found or token invalid
    """
    token_data = await verify_token(token)

    stmt = select(User).where(User.id == token_data.sub)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")

    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Get current active user (wrapper for clarity).

    Args:
        current_user: Current user from get_current_user

    Returns:
        Current active user
    """
    return current_user


def require_role(required_role: str):
    """
    Dependency to check user role.

    Usage:
        @router.get("/admin/")
        async def admin_only(user: User = Depends(require_role("admin"))):
            ...
    """

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.value != required_role and current_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to perform this action"
            )
        return current_user

    return role_checker
