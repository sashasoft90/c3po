"""Pytest configuration and fixtures."""

import asyncio
from collections.abc import AsyncGenerator, Generator
from typing import Any

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import Settings, get_settings
from app.database import Base, get_db
from app.main import app
from app.redis import close_redis, init_redis


# Test database URL (use separate test database)
TEST_DATABASE_URL = "postgresql+asyncpg://c3po:c3po_dev@localhost:5432/c3po_test"


def get_test_settings() -> Settings:
    """Override settings for testing."""
    settings = Settings(
        ENVIRONMENT="testing",
        DATABASE_URL=TEST_DATABASE_URL,
        SECRET_KEY="test-secret-key-min-32-characters-long",
        DEBUG=True,
        LOG_LEVEL="WARNING",
    )
    return settings


@pytest.fixture(scope="function")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create event loop for pytest-asyncio."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Drop all tables after tests
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session."""
    async_session = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(scope="function", autouse=True)
async def test_redis():
    """Initialize test Redis connection."""
    # Always reinitialize for each test to ensure clean state
    await init_redis()
    yield
    # Clean up: close Redis connections properly
    try:
        await close_redis()
    except Exception:
        # Ignore errors during cleanup
        pass


@pytest.fixture
async def override_get_db(db_session: AsyncSession):
    """Override database dependency for testing."""

    async def _override_get_db():
        try:
            yield db_session
        except Exception:
            await db_session.rollback()
            raise

    return _override_get_db


@pytest.fixture
def client() -> TestClient:
    """Create test client for simple tests without database."""
    # Override settings
    app.dependency_overrides[get_settings] = get_test_settings
    with TestClient(app) as client:
        yield client
    # Clear overrides
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_app(override_get_db):
    """Create test FastAPI application with database."""
    # Override settings and database
    app.dependency_overrides[get_settings] = get_test_settings
    app.dependency_overrides[get_db] = override_get_db

    yield app

    # Clear overrides
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def async_client(test_app) -> AsyncGenerator[AsyncClient, None]:
    """Create async test client with database."""
    from httpx import ASGITransport

    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as ac:
        yield ac


# Test data fixtures
@pytest.fixture
def test_user_data() -> dict[str, Any]:
    """Sample user data for testing."""
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "first_name": "Test",
        "last_name": "User",
    }


@pytest.fixture
def test_appointment_data() -> dict[str, Any]:
    """Sample appointment data for testing."""
    from datetime import datetime, timedelta

    now = datetime.now()
    return {
        "title": "Test Appointment",
        "description": "Test description",
        "start_time": (now + timedelta(days=1)).isoformat(),
        "end_time": (now + timedelta(days=1, hours=1)).isoformat(),
    }


@pytest_asyncio.fixture
async def auth_headers(async_client: AsyncClient, test_user_data: dict) -> dict[str, str]:
    """
    Create authenticated user and return authorization headers.

    Returns:
        Dict with Authorization header
    """
    # Register user
    register_response = await async_client.post("/api/v1/auth/register", json=test_user_data)
    assert register_response.status_code == 201

    # Login
    login_data = {
        "username": test_user_data["email"],
        "password": test_user_data["password"],
    }
    login_response = await async_client.post("/api/v1/auth/login", data=login_data)
    assert login_response.status_code == 200

    token_data = login_response.json()
    access_token = token_data["access_token"]

    return {"Authorization": f"Bearer {access_token}"}
