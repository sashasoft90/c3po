"""Database configuration and session management."""

from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, declared_attr

from app.config import settings

# Naming convention for constraints (important for Alembic migrations)
convention: dict[str, str] = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=convention)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    metadata = metadata

    # Generate __tablename__ automatically from class name
    @declared_attr.directive
    def __tablename__(cls) -> str:
        """Convert CamelCase class name to snake_case table name."""
        # Convert "UserAccount" -> "user_account"
        import re

        name = cls.__name__
        return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()

    # Add repr for debugging
    def __repr__(self) -> str:
        """String representation of model."""
        columns = ", ".join(
            f"{col.name}={getattr(self, col.name)!r}"
            for col in self.__table__.columns
            if col.name != "password_hash"  # Don't show password hash
        )
        return f"{self.__class__.__name__}({columns})"


# Create async engine
engine = create_async_engine(
    str(settings.DATABASE_URL),
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    pool_pre_ping=True,  # Verify connections before using
    pool_size=10,
    max_overflow=20,
)

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get database session.

    Usage in FastAPI routes:
        @router.get("/users/")
        async def get_users(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(User))
            return result.scalars().all()
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database (create all tables). Use only for testing!"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def drop_db() -> None:
    """Drop all tables. Use only for testing!"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def check_db_connection() -> dict[str, Any]:
    """Check database connection for health endpoint."""
    try:
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}
