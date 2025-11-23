"""Appointment management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.appointment import Appointment
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, AppointmentRead, AppointmentUpdate
from app.services.cache import cache_service
from app.utils.security import get_current_user

router = APIRouter()


@router.post("/", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_in: AppointmentCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> Appointment:
    """
    Create a new appointment.

    Args:
        appointment_in: Appointment creation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Created appointment
    """
    appointment = Appointment(**appointment_in.model_dump(), user_id=current_user.id)

    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)

    # Invalidate appointments list cache
    await cache_service.delete(f"appointments:user:{current_user.id}")

    return appointment


@router.get("/", response_model=list[AppointmentRead])
async def read_appointments(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Appointment]:
    """
    Get all appointments for current user.

    Uses cache for better performance (cache TTL: 1 minute).

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of appointments
    """
    # Cache key includes pagination params
    cache_key = f"appointments:user:{current_user.id}:skip:{skip}:limit:{limit}"
    cached_appointments = await cache_service.get(cache_key)

    if cached_appointments:
        # Return cached appointments (already serialized)
        return [Appointment(**apt) for apt in cached_appointments]

    # Cache miss - fetch from database
    stmt = select(Appointment).where(Appointment.user_id == current_user.id).offset(skip).limit(limit)

    result = await db.execute(stmt)
    appointments = result.scalars().all()

    # Cache appointments for 1 minute (shorter TTL as appointments change frequently)
    appointments_data = [
        {
            "id": apt.id,
            "user_id": apt.user_id,
            "title": apt.title,
            "description": apt.description,
            "start_time": apt.start_time.isoformat(),
            "end_time": apt.end_time.isoformat(),
            "status": apt.status.value,
            "notes": apt.notes,
            "created_at": apt.created_at.isoformat() if apt.created_at else None,
            "updated_at": apt.updated_at.isoformat() if apt.updated_at else None,
        }
        for apt in appointments
    ]
    await cache_service.set(cache_key, appointments_data, expire=60)  # 1 minute

    return list(appointments)


@router.get("/{appointment_id}", response_model=AppointmentRead)
async def read_appointment(
    appointment_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> Appointment:
    """
    Get appointment by ID.

    Args:
        appointment_id: Appointment ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        Appointment data

    Raises:
        HTTPException: If appointment not found or user doesn't have access
    """
    stmt = select(Appointment).where(Appointment.id == appointment_id)
    result = await db.execute(stmt)
    appointment = result.scalar_one_or_none()

    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    # Check if user owns the appointment or is admin/staff
    if appointment.user_id != current_user.id and current_user.role.value not in ["admin", "staff"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this appointment")

    return appointment


@router.patch("/{appointment_id}", response_model=AppointmentRead)
async def update_appointment(
    appointment_id: int,
    appointment_update: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Appointment:
    """
    Update appointment.

    Args:
        appointment_id: Appointment ID
        appointment_update: Appointment update data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated appointment

    Raises:
        HTTPException: If appointment not found or user doesn't have access
    """
    stmt = select(Appointment).where(Appointment.id == appointment_id)
    result = await db.execute(stmt)
    appointment = result.scalar_one_or_none()

    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    # Check if user owns the appointment or is admin/staff
    if appointment.user_id != current_user.id and current_user.role.value not in ["admin", "staff"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this appointment")

    # Update appointment fields
    update_data = appointment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)

    # Invalidate appointments list cache
    await cache_service.clear_pattern(f"appointments:user:{appointment.user_id}:*")

    await db.commit()
    await db.refresh(appointment)

    return appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> None:
    """
    Delete appointment.

    Args:
        appointment_id: Appointment ID
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If appointment not found or user doesn't have access
    """
    stmt = select(Appointment).where(Appointment.id == appointment_id)
    result = await db.execute(stmt)
    appointment = result.scalar_one_or_none()

    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    # Check if user owns the appointment or is admin
    if appointment.user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this appointment")

    user_id = appointment.user_id  # Save before deleting
    await db.delete(appointment)
    await db.commit()

    # Invalidate appointments list cache
    await cache_service.clear_pattern(f"appointments:user:{user_id}:*")
