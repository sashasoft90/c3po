"""Authentication endpoints."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.redis import cache_set
from app.schemas.auth import LoginRequest, RefreshTokenRequest, Token
from app.schemas.user import UserCreate, UserRead
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_password_hash,
    verify_password,
)

from app.utils.security import verify_token

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)) -> User:
    """
    Register a new user.

    Args:
        user_in: User registration data
        db: Database session

    Returns:
        Created user

    Raises:
        HTTPException: If email already exists
    """
    # Check if user exists
    stmt = select(User).where(User.email == user_in.email)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # Create new user
    user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        phone=user_in.phone,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)) -> Token:
    """
    OAuth2 compatible token login.

    Args:
        form_data: OAuth2 form with username (email) and password
        db: Database session

    Returns:
        Access and refresh tokens

    Raises:
        HTTPException: If credentials are invalid
    """
    # Get user by email
    stmt = select(User).where(User.email == form_data.username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")

    access_token_jti = str(uuid.uuid4())
    access_token = create_access_token(subject=user.id, jti=access_token_jti)
    refresh_token_id, user_id = create_refresh_token(subject=user.id)

    # Store refresh token in Redis
    await cache_set(
        f"refresh_token:{refresh_token_id}", user_id, expire=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )

    return Token(access_token=access_token, refresh_token=refresh_token_id)


@router.post("/login/json", response_model=Token)
async def login_json(login_data: LoginRequest, db: AsyncSession = Depends(get_db)) -> Token:
    """
    JSON login endpoint (alternative to OAuth2 form).

    Args:
        login_data: Login credentials
        db: Database session

    Returns:
        Access and refresh tokens
    """
    stmt = select(User).where(User.email == login_data.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")

    access_token_jti = str(uuid.uuid4())
    access_token = create_access_token(subject=user.id, jti=access_token_jti)
    refresh_token_id, user_id = create_refresh_token(subject=user.id)

    # Store refresh token in Redis
    await cache_set(
        f"refresh_token:{refresh_token_id}", user_id, expire=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )

    return Token(access_token=access_token, refresh_token=refresh_token_id)


@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_data: RefreshTokenRequest) -> Token:
    """
    Refresh access token using refresh token.

    Args:
        refresh_data: Refresh token

    Returns:
        New access and refresh tokens

    Raises:
        HTTPException: If refresh token is invalid
    """
    from app.redis import cache_get

    # Get user ID from Redis
    user_id = await cache_get(f"refresh_token:{refresh_data.refresh_token}")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    access_token_jti = str(uuid.uuid4())
    access_token = create_access_token(subject=int(user_id), jti=access_token_jti)
    new_refresh_token_id, _ = create_refresh_token(subject=int(user_id))

    # Store new refresh token in Redis
    await cache_set(
        f"refresh_token:{new_refresh_token_id}",
        user_id,
        expire=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )

    # Optionally delete old refresh token
    from app.redis import cache_delete

    await cache_delete(f"refresh_token:{refresh_data.refresh_token}")

    return Token(access_token=access_token, refresh_token=new_refresh_token_id)


@router.post("/logout")
async def logout(request: Request, current_user: User = Depends(get_current_user)) -> dict[str, str]:
    """
    Logout current user (invalidate tokens).

    Extracts the access token from the Authorization header, verifies it,
    and adds its JTI to the blacklist in Redis.

    Args:
        request: FastAPI request object
        current_user: Current authenticated user

    Returns:
        Success message
    """

    # Extract token from Authorization header
    authorization: str | None = request.headers.get("Authorization")
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")

        # Verify token and get JTI
        token_data = await verify_token(token)

        if token_data.jti:
            # Add access token to blacklist (expire after token expiration)
            ttl = token_data.exp - int(datetime.now(timezone.utc).timestamp())
            if ttl > 0:
                await cache_set(f"token:blacklist:{token_data.jti}", "1", expire=ttl)

    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: User = Depends(get_current_user)) -> User:
    """
    Get current user profile.

    Args:
        current_user: Current authenticated user

    Returns:
        Current user data
    """
    return current_user
