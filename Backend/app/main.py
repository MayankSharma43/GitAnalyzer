"""
app/main.py — FastAPI application entrypoint.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import create_all_tables

logger = logging.getLogger(__name__)


# ── Lifespan ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting up Developer Career Intelligence System API...")
    await create_all_tables()
    logger.info("Database tables ready.")
    yield
    logger.info("Shutting down...")


# ── App factory ────────────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title="Developer Career Intelligence System",
        description=(
            "Audits a developer's real-world skills by analyzing GitHub repos "
            "and live applications — then generates a brutally honest AI skill report."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── CORS ───────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ────────────────────────────────────────────────────────────
    from app.api.routes.audit import router as audit_router
    from app.api.routes.health import router as health_router

    app.include_router(health_router, tags=["Health"])
    app.include_router(audit_router, prefix="/audit", tags=["Audit"])

    # ── Global exception handler ───────────────────────────────────────────
    @app.exception_handler(Exception)
    async def _unhandled(request, exc: Exception):  # type: ignore[override]
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(exc)},
        )

    return app


app = create_app()
