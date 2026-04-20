"""app/schemas/common.py — Shared response schemas."""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    db: str
    redis: str
    environment: str
