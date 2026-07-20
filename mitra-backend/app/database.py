"""Database connection and session management."""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
import redis.asyncio as aioredis
from .config import settings


# SQLAlchemy async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.APP_ENV == "development",
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


# Redis client (singleton)
_redis_client = None


async def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_client


async def get_db() -> AsyncSession:
    """Dependency: yield an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_db_health() -> dict:
    """Ping the database and return status."""
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "postgresql"}
    except Exception as e:
        return {"status": "unhealthy", "database": "postgresql", "error": str(e)}


async def check_redis_health() -> dict:
    """Ping Redis and return status."""
    try:
        r = await get_redis()
        await r.ping()
        return {"status": "healthy", "cache": "redis"}
    except Exception as e:
        return {"status": "unhealthy", "cache": "redis", "error": str(e)}
