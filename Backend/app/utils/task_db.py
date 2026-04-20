"""
app/utils/task_db.py
────────────────────
Provides a fresh database engine + session for use inside Celery tasks.

Celery tasks call asyncio.run() which creates a new event loop each time.
The shared `app.database.engine` (created at import time) uses a connection
pool tied to the original event loop, causing asyncpg errors.

Solution: create a fresh engine + session for each task invocation,
then dispose it immediately after.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings


@asynccontextmanager
async def task_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield a fresh AsyncSession for a Celery task.
    Creates a new engine, uses it, then disposes it.
    """
    engine = create_async_engine(
        settings.database_url,
        pool_size=2,
        max_overflow=2,
        pool_pre_ping=True,
        echo=False,
    )
    factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
    session: AsyncSession = factory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
        await engine.dispose()
