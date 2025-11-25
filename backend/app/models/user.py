"""User model."""

import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    """User role enumeration."""

    USER = "user"  # Regular user (can book appointments)
    STAFF = "staff"  # Staff member (doctor, specialist, etc.)
    ADMIN = "admin"  # Administrator (full access)


class User(Base):
    """User model for authentication and profile management."""

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Authentication
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True)
    is_verified: Mapped[bool] = mapped_column(default=False)

    # Role
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, native_enum=False, length=20), default=UserRole.USER, nullable=False
    )

    # Profile
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    appointments: Mapped[list["Appointment"]] = relationship(
        "Appointment", back_populates="user", cascade="all, delete-orphan"
    )

    @property
    def full_name(self) -> str:
        """Get full name."""
        return f"{self.first_name} {self.last_name}"

    def __repr__(self) -> str:
        """String representation."""
        return f"User(id={self.id}, email={self.email!r}, role={self.role.value})"
