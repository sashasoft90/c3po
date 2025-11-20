"""Appointment management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.appointment import Appointment
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, AppointmentRead, AppointmentUpdate
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

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of appointments
    """
    stmt = select(Appointment).where(Appointment.user_id == current_user.id).offset(skip).limit(limit)

    result = await db.execute(stmt)
    appointments = result.scalars().all()

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

    await db.delete(appointment)
    await db.commit()
