"""User management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate
from app.services.cache import cache_service
from app.utils.security import get_current_user, require_role

router = APIRouter()


@router.get("/me", response_model=UserRead)
async def read_user_me(current_user: User = Depends(get_current_user)) -> User:
    """Get current user profile."""
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_user_me(
    user_update: UserUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> User:
    """
    Update current user profile.

    Args:
        user_update: User update data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated user
    """
    # Check if email is being changed and if it's already taken
    if user_update.email and user_update.email != current_user.email:
        stmt = select(User).where(User.email == user_update.email)
        result = await db.execute(stmt)
        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # Update user fields
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    # Invalidate user cache after update
    await cache_service.delete(f"user:{current_user.id}")

    return current_user


@router.get("/{user_id}", response_model=UserRead)
async def read_user(
    user_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(require_role("admin"))
) -> User:
    """
    Get user by ID (admin only).

    Uses cache to reduce database load.

    Args:
        user_id: User ID
        db: Database session

    Returns:
        User data

    Raises:
        HTTPException: If user not found
    """
    # Try cache first
    cache_key = f"user:{user_id}"
    cached_user = await cache_service.get(cache_key)

    if cached_user:
        return User(**cached_user)

    # Cache miss - fetch from database
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Cache user data for 5 minutes
    user_dict = {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "role": user.role.value,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }
    await cache_service.set(cache_key, user_dict, expire=300)

    return user


@router.get("/", response_model=list[UserRead])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> list[User]:
    """
    Get all users (admin only).

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        db: Database session

    Returns:
        List of users
    """
    stmt = select(User).offset(skip).limit(limit)
    result = await db.execute(stmt)
    users = result.scalars().all()

    return list(users)
