"""app/api/routes/health.py — Liveness check endpoint."""
from __future__ import annotations

import logging

import redis.asyncio as aioredis
from fastapi import APIRouter
from sqlalchemy import text

from app.config import settings
from app.database import AsyncSessionLocal
from app.schemas.common import HealthResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Liveness probe — checks DB and Redis connectivity."""

    # ── Database probe ─────────────────────────────────────────────────────
    db_status = "ok"
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception as exc:
        logger.warning("DB health check failed: %s", exc)
        db_status = f"error: {exc}"

    # ── Redis probe ────────────────────────────────────────────────────────
    redis_status = "ok"
    try:
        r = aioredis.from_url(settings.redis_url, decode_responses=True)
        await r.ping()
        await r.aclose()
    except Exception as exc:
        logger.warning("Redis health check failed: %s", exc)
        redis_status = f"error: {exc}"

    return HealthResponse(
        status="ok",
        version="1.0.0",
        db=db_status,
        redis=redis_status,
        environment=settings.app_env,
    )
