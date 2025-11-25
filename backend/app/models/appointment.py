"""Appointment model."""

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AppointmentStatus(str, enum.Enum):
    """Appointment status enumeration."""

    PENDING = "pending"  # Awaiting confirmation
    CONFIRMED = "confirmed"  # Confirmed by staff
    CANCELLED = "cancelled"  # Cancelled by user or staff
    COMPLETED = "completed"  # Appointment completed
    NO_SHOW = "no_show"  # User didn't show up


class Appointment(Base):
    """Appointment model for scheduling."""

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign keys
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False, index=True)

    # Appointment details
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Scheduling
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    # Status
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus, native_enum=False, length=20), default=AppointmentStatus.PENDING, nullable=False
    )

    # Notes (internal, staff-only)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="appointments")

    def __repr__(self) -> str:
        """String representation."""
        return f"Appointment(id={self.id}, user_id={self.user_id}, title={self.title!r}, status={self.status.value})"
