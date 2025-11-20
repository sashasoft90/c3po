"""API routes."""

from fastapi import APIRouter

from app.api import appointments, auth, users

api_router = APIRouter()

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
