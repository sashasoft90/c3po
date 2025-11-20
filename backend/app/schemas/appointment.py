"""Appointment schemas for request/response validation."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.appointment import AppointmentStatus


class AppointmentBase(BaseModel):
    """Base appointment schema with common fields."""

    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)
    start_time: datetime
    end_time: datetime

    @field_validator("end_time")
    @classmethod
    def validate_end_time(cls, v: datetime, info) -> datetime:
        """Validate that end_time is after start_time."""
        start_time = info.data.get("start_time")
        if start_time and v <= start_time:
            msg = "end_time must be after start_time"
            raise ValueError(msg)
        return v


class AppointmentCreate(AppointmentBase):
    """Schema for creating an appointment."""

    pass


class AppointmentUpdate(BaseModel):
    """Schema for updating an appointment."""

    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)
    start_time: datetime | None = None
    end_time: datetime | None = None
    status: AppointmentStatus | None = None
    notes: str | None = Field(None, max_length=2000)


class AppointmentRead(AppointmentBase):
    """Schema for appointment response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    status: AppointmentStatus
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
