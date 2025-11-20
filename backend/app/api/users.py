"""User management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate
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

    return current_user


@router.get("/{user_id}", response_model=UserRead)
async def read_user(
    user_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(require_role("admin"))
) -> User:
    """
    Get user by ID (admin only).

    Args:
        user_id: User ID
        db: Database session

    Returns:
        User data

    Raises:
        HTTPException: If user not found
    """
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

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
