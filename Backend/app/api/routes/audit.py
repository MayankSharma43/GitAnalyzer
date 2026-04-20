"""
app/api/routes/audit.py — Audit CRUD + WebSocket progress stream.
"""
from __future__ import annotations

import asyncio
import json
import logging
import uuid
from typing import Any, Dict

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.audit import Audit, AuditStatus
from app.models.report import Report
from app.models.user import User
from app.schemas.audit import AuditCreate, AuditResponse, AuditStatusResponse, ScoreSummary
from app.schemas.report import (
    CriticalIssue,
    RadarDataPoint,
    Recommendation,
    ReportResponse,
    ScoreSummaryFull,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Helpers ────────────────────────────────────────────────────────────────────

def _parse_github_username(github_url: str) -> str:
    """Extract 'torvalds' from 'https://github.com/torvalds'."""
    return github_url.rstrip("/").split("/")[-1]


async def _get_or_create_user(session: AsyncSession, github_username: str) -> User:
    result = await session.execute(
        select(User).where(User.github_username == github_username)
    )
    user = result.scalar_one_or_none()
    if user is None:
        user = User(github_username=github_username)
        session.add(user)
        await session.flush()
    return user


# ── POST /audit ────────────────────────────────────────────────────────────────

@router.post("", response_model=AuditResponse, status_code=202)
async def create_audit(
    payload: AuditCreate,
    db: AsyncSession = Depends(get_db),
) -> AuditResponse:
    """
    Create a new audit and enqueue the Celery pipeline.

    Returns immediately with `audit_id` — connect to
    `WS /audit/{audit_id}/progress` for live updates.
    """
    github_username = _parse_github_username(payload.github_url)
    user = await _get_or_create_user(db, github_username)

    audit = Audit(
        user_id=user.id,
        status=AuditStatus.pending,
        input_github_url=payload.github_url,
        input_repo_urls=payload.additional_urls or [],
        input_live_url=payload.live_app_url,
        claimed_level=payload.claimed_level,
        location=payload.location,
        remote=payload.remote,
    )
    db.add(audit)
    await db.flush()
    audit_id = audit.id
    await db.commit()

    # ── Enqueue Celery pipeline ────────────────────────────────────────────
    try:
        from app.workers.pipeline import start_audit_pipeline
        start_audit_pipeline(str(audit_id))
        logger.info("Audit %s queued for GitHub user %s", audit_id, github_username)
    except Exception as exc:
        logger.error("Failed to enqueue audit %s: %s", audit_id, exc)
        # Don't fail the request — the audit row exists, user can retry
        async with db.begin():
            audit.status = AuditStatus.failed
            audit.error_message = f"Failed to enqueue task: {exc}"

    return AuditResponse(
        audit_id=audit_id,
        status=AuditStatus.pending.value,
        message=(
            f"Audit queued. Connect to /audit/{audit_id}/progress "
            "for live updates."
        ),
    )


# ── GET /audit/{audit_id} ──────────────────────────────────────────────────────

@router.get("/{audit_id}", response_model=AuditStatusResponse)
async def get_audit_status(
    audit_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AuditStatusResponse:
    """Return audit status + score summary (once completed)."""
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit: Audit | None = result.scalar_one_or_none()

    if audit is None:
        raise HTTPException(
            status_code=404,
            detail={"error": "Audit not found", "detail": f"No audit with id={audit_id}"},
        )

    scores: ScoreSummary | None = None
    skill_level: str | None = None
    percentile: int | None = None

    if audit.report is not None:
        rpt = audit.report
        scores = ScoreSummary(
            code_quality=rpt.code_quality_score,
            architecture=rpt.architecture_score,
            testing=rpt.testing_score,
            performance=rpt.performance_score,
            deployment=rpt.deployment_score,
            overall=rpt.overall_score,
        )
        skill_level = rpt.skill_level.value
        percentile = rpt.percentile

    github_username = _parse_github_username(audit.input_github_url)

    return AuditStatusResponse(
        audit_id=audit.id,
        status=audit.status.value,
        github_username=github_username,
        created_at=audit.created_at,
        completed_at=audit.completed_at,
        scores=scores,
        skill_level=skill_level,
        percentile=percentile,
        error_message=audit.error_message,
    )


# ── GET /audit/{audit_id}/report ───────────────────────────────────────────────

@router.get("/{audit_id}/report", response_model=ReportResponse)
async def get_audit_report(
    audit_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ReportResponse:
    """Return the full structured report for a completed audit."""
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit: Audit | None = result.scalar_one_or_none()

    if audit is None:
        raise HTTPException(
            status_code=404,
            detail={"error": "Audit not found", "detail": f"No audit with id={audit_id}"},
        )

    if audit.status != AuditStatus.completed:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "Report not ready",
                "detail": f"Audit status is '{audit.status.value}'. Wait for 'completed'.",
            },
        )

    rpt: Report | None = audit.report
    if rpt is None:
        raise HTTPException(
            status_code=404,
            detail={"error": "Report not found", "detail": "Audit completed but report is missing."},
        )

    # ── Parse JSONB fields ─────────────────────────────────────────────────
    critical_issues = [
        CriticalIssue(**item) if isinstance(item, dict) else item
        for item in (rpt.critical_issues or [])
    ]
    recommendations = [
        Recommendation(**item) if isinstance(item, dict) else item
        for item in (rpt.recommendations or [])
    ]
    radar_data = [
        RadarDataPoint(**item) if isinstance(item, dict) else item
        for item in (rpt.radar_data or [])
    ]

    # ── Language distribution from repositories ────────────────────────────
    lang_counts: Dict[str, int] = {}
    for repo in audit.repositories:
        if repo.language:
            lang_counts[repo.language] = lang_counts.get(repo.language, 0) + 1

    LANG_COLORS = {
        "TypeScript": "#a78bfa", "JavaScript": "#ef4444",
        "Python": "#06b6d4", "Go": "#10b981",
        "Rust": "#f59e0b", "Java": "#f97316",
        "C++": "#8b5cf6", "Ruby": "#ec4899",
    }
    total_repos = max(len(audit.repositories), 1)
    languages = [
        {
            "name": lang,
            "value": round((count / total_repos) * 100),
            "color": LANG_COLORS.get(lang, "#64748b"),
        }
        for lang, count in sorted(lang_counts.items(), key=lambda x: -x[1])
    ]

    return ReportResponse(
        audit_id=audit.id,
        skill_level=rpt.skill_level.value,
        overall_score=rpt.overall_score,
        percentile=rpt.percentile,
        scores=ScoreSummaryFull(
            code_quality=rpt.code_quality_score,
            architecture=rpt.architecture_score,
            testing=rpt.testing_score,
            performance=rpt.performance_score,
            deployment=rpt.deployment_score,
            overall=rpt.overall_score,
        ),
        strengths=rpt.strengths or [],
        critical_issues=critical_issues,
        recommendations=recommendations,
        radar_data=radar_data,
        career_narrative=rpt.llm_narrative,
        repos_analysed=len(audit.repositories),
        languages=languages,
        created_at=rpt.created_at,
    )


# ── WS /audit/{audit_id}/progress ─────────────────────────────────────────────

@router.websocket("/{audit_id}/progress")
async def audit_progress_websocket(
    websocket: WebSocket,
    audit_id: uuid.UUID,
) -> None:
    """
    WebSocket stream — emits ProgressEvent JSON objects as the Celery
    pipeline advances. Closes automatically when status is completed/failed.
    """
    await websocket.accept()
    channel = f"audit:{audit_id}:progress"

    try:
        r = aioredis.from_url(settings.redis_url, decode_responses=True)
        pubsub = r.pubsub()
        await pubsub.subscribe(channel)

        logger.info("WS client connected for audit %s", audit_id)

        try:
            while True:
                message: Dict[str, Any] | None = await asyncio.wait_for(
                    pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0),
                    timeout=30.0,
                )
                if message and message.get("type") == "message":
                    data_str = message["data"]
                    await websocket.send_text(data_str)

                    # Close when terminal state reached
                    try:
                        event = json.loads(data_str)
                        if event.get("status") in ("completed", "failed"):
                            break
                    except json.JSONDecodeError:
                        pass

                # Ping to keep connection alive
                await websocket.send_json({"type": "ping"})

        except asyncio.TimeoutError:
            await websocket.send_json({"type": "ping"})

    except WebSocketDisconnect:
        logger.info("WS client disconnected for audit %s", audit_id)
    except Exception as exc:
        logger.error("WS error for audit %s: %s", audit_id, exc)
        try:
            await websocket.send_json({"error": str(exc)})
        except Exception:
            pass
    finally:
        try:
            await pubsub.unsubscribe(channel)
            await pubsub.aclose()
            await r.aclose()
        except Exception:
            pass
        try:
            await websocket.close()
        except Exception:
            pass
