"""app/schemas/report.py — Full structured report response schema."""
from __future__ import annotations

import datetime
import uuid
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class CriticalIssue(BaseModel):
    severity: str  # CRITICAL | HIGH | MEDIUM | LOW
    file: Optional[str] = None
    line: Optional[int] = None
    title: str
    description: str
    fix: Optional[str] = None
    owasp: Optional[str] = None


class Recommendation(BaseModel):
    rank: int
    title: str
    effort: str  # e.g. "1h", "2 days"
    impact: str  # CRITICAL | HIGH | MEDIUM | LOW
    why: Optional[str] = None


class RadarDataPoint(BaseModel):
    axis: str
    claimed: float
    actual: float


class ScoreSummaryFull(BaseModel):
    code_quality: float
    architecture: float
    testing: float
    performance: float
    deployment: float
    overall: float


class ReportResponse(BaseModel):
    """Full structured report for GET /audit/{audit_id}/report."""

    audit_id: uuid.UUID
    skill_level: str
    overall_score: float
    percentile: int
    scores: ScoreSummaryFull

    # LLM-generated structured data
    strengths: List[str] = []
    critical_issues: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    radar_data: List[Dict[str, Any]]
    career_narrative: Optional[str] = None
    roadmap: Optional[List[Dict[str, Any]]] = None
    job_matches: Optional[List[Dict[str, Any]]] = None
    resume_bullets: Optional[List[Dict[str, Any]]] = None
    repos_analysed: int
    languages: List[Dict[str, Any]] = []

    created_at: datetime.datetime

    model_config = {"from_attributes": True}
