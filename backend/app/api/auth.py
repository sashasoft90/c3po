"""Authentication endpoints."""

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
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

    # Create tokens
    access_token = create_access_token(subject=user.id)
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

    # Create tokens
    access_token = create_access_token(subject=user.id)
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

    # Create new tokens
    access_token = create_access_token(subject=int(user_id))
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
async def logout(current_user: User = Depends(get_current_user)) -> dict[str, str]:
    """
    Logout current user (invalidate tokens).

    Args:
        current_user: Current authenticated user

    Returns:
        Success message

    Note:
        In a production system, you would also blacklist the current access token.
        This requires storing the token's JTI in Redis until expiration.
    """
    # TODO: Add access token to blacklist if JTI is included in token

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
