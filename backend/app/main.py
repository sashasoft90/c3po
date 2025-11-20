"""Main FastAPI application."""

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.api import api_router
from app.config import settings
from app.database import check_db_connection
from app.redis import check_redis_connection, close_redis, init_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting C3PO Backend...")

    # Initialize Redis
    await init_redis()
    logger.info("Redis initialized")

    yield

    # Shutdown
    logger.info("Shutting down C3PO Backend...")
    await close_redis()
    logger.info("Redis connection closed")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="C3PO Backend API - Appointment scheduling system",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {
        "message": "C3PO Backend API",
        "version": settings.VERSION,
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health")
async def health_check() -> dict[str, Any]:
    """Health check endpoint."""
    db_status = await check_db_connection()
    redis_status = await check_redis_connection()

    overall_status = "healthy" if db_status["status"] == "healthy" and redis_status["status"] == "healthy" else "unhealthy"

    return {
        "status": overall_status,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "redis": redis_status,
    }


@app.get("/health/db")
async def health_check_db() -> dict[str, Any]:
    """Database health check endpoint."""
    return await check_db_connection()


@app.get("/health/redis")
async def health_check_redis() -> dict[str, Any]:
    """Redis health check endpoint."""
    return await check_redis_connection()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
