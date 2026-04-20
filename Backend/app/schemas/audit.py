"""app/schemas/audit.py — Audit request / response schemas."""
from __future__ import annotations

import datetime
import uuid
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl, field_validator


class AuditCreate(BaseModel):
    """Payload for POST /audit."""

    github_url: str = Field(
        ...,
        description="Full GitHub profile URL, e.g. https://github.com/torvalds",
        examples=["https://github.com/torvalds"],
    )
    additional_urls: List[str] = Field(
        default_factory=list,
        description="Extra repo or deployed-app URLs to analyse.",
    )
    live_app_url: Optional[str] = Field(
        default=None,
        description="URL of a live web application to Lighthouse-audit.",
    )
    claimed_level: Optional[str] = Field(
        default=None,
        description="Self-assessed level: Junior | Mid-level | Senior | Staff",
    )
    location: Optional[str] = Field(default=None)
    remote: bool = Field(default=False)

    @field_validator("github_url")
    @classmethod
    def validate_github_url(cls, v: str) -> str:
        if "github.com/" not in v:
            raise ValueError("Must be a valid github.com profile URL.")
        return v.rstrip("/")


class ScoreSummary(BaseModel):
    code_quality: float
    architecture: float
    testing: float
    performance: float
    deployment: float
    overall: float


class AuditResponse(BaseModel):
    """Response for POST /audit — minimal, just the ID and status."""

    audit_id: uuid.UUID
    status: str
    message: str

    model_config = {"from_attributes": True}


class AuditStatusResponse(BaseModel):
    """Response for GET /audit/{audit_id}."""

    audit_id: uuid.UUID
    status: str
    github_username: Optional[str] = None
    created_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None
    scores: Optional[ScoreSummary] = None
    skill_level: Optional[str] = None
    percentile: Optional[int] = None
    error_message: Optional[str] = None

    model_config = {"from_attributes": True}
