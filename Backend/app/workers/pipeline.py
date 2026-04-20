"""
app/workers/pipeline.py
──────────────────────────────────────────────────────────────────────────────
Celery task chain orchestration.
Each step publishes progress events to Redis pub/sub for WebSocket consumption.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict

import redis

from app.config import settings
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


def _redis_client() -> redis.Redis:
    return redis.from_url(settings.redis_url, decode_responses=True)


def publish_progress(
    audit_id: str,
    step: int,
    step_name: str,
    message: str,
    section: str,
    status: str = "running",
    data: Dict[str, Any] | None = None,
) -> None:
    """Publish a progress event to Redis pub/sub channel `audit:{id}:progress`."""
    event = {
        "audit_id": audit_id,
        "step": step,
        "total_steps": 6,
        "step_name": step_name,
        "message": message,
        "section": section,
        "percent": round((step / 6) * 100, 1),
        "status": status,
        "data": data or {},
    }
    channel = f"audit:{audit_id}:progress"
    try:
        r = _redis_client()
        r.publish(channel, json.dumps(event))
    except Exception as exc:
        logger.warning("Failed to publish progress event: %s", exc)


def start_audit_pipeline(audit_id: str) -> None:
    """
    Kick off the full analysis pipeline as a Celery chain.
    Each task receives audit_id and passes it forward.
    """
    from celery import chain
    from app.workers.tasks.github_tasks import fetch_github_data
    from app.workers.tasks.clone_tasks import clone_repositories
    from app.workers.tasks.analysis_tasks import run_static_analysis
    from app.workers.tasks.web_tasks import run_web_audit
    from app.workers.tasks.scoring_tasks import score_developer
    from app.workers.tasks.report_tasks import generate_report

    pipeline = chain(
        fetch_github_data.s(audit_id),
        clone_repositories.s(),
        run_static_analysis.s(),
        run_web_audit.s(),
        score_developer.s(),
        generate_report.s(),
    )

    pipeline.apply_async()
    logger.info("Audit pipeline started for audit_id=%s", audit_id)
