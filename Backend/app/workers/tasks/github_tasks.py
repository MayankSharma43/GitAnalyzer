"""
app/workers/tasks/github_tasks.py — Step 1: Fetch GitHub data.
Uses task_session() to avoid asyncio event loop conflicts in Celery.
"""
from __future__ import annotations

import logging

from app.utils.task_runner import run_async
from app.workers.celery_app import celery_app
from app.workers.pipeline import publish_progress

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.fetch_github_data", bind=True, max_retries=2)
def fetch_github_data(self, audit_id: str) -> str:
    """
    Step 1 — Fetch GitHub profile, repos, contributions, pinned repos, and PRs.
    Stores raw data in audit.github_data (JSONB).
    Returns audit_id downstream.
    """
    from app.utils.task_db import task_session
    from app.models.audit import Audit, AuditStatus
    from app.services.github_service import fetch_all_github_data
    from sqlalchemy import select

    publish_progress(
        audit_id=audit_id,
        step=1,
        step_name="Fetching GitHub profile",
        message="Fetching GitHub profile and repository data...",
        section="CODE",
    )

    async def _run() -> None:
        async with task_session() as session:
            result = await session.execute(
                select(Audit).where(Audit.id == audit_id)
            )
            audit = result.scalar_one_or_none()
            if audit is None:
                raise ValueError(f"Audit {audit_id} not found")

            # Mark as running
            audit.status = AuditStatus.running
            await session.commit()

            # Extract username
            github_url = audit.input_github_url
            username = github_url.rstrip("/").split("/")[-1]

            # Fetch all GitHub data
            github_data = await fetch_all_github_data(username)

            # Persist
            audit.github_data = github_data
            await session.commit()

            total_repos = github_data.get("total_repos", 0)
            publish_progress(
                audit_id=audit_id,
                step=1,
                step_name="Fetching GitHub profile",
                message=f"Found {total_repos} public repositories. Selecting top 5 for deep analysis.",
                section="CODE",
                data={"total_repos": total_repos},
            )

    try:
        run_async(_run())
    except Exception as exc:
        logger.error("fetch_github_data failed for %s: %s", audit_id, exc)
        try:
            self.retry(exc=exc, countdown=5)
        except self.MaxRetriesExceededError:
            _mark_failed(audit_id, str(exc))
            raise

    return audit_id


def _mark_failed(audit_id: str, error: str) -> None:
    """Synchronously mark an audit as failed."""
    import asyncio as _asyncio
    from app.utils.task_db import task_session
    from app.utils.task_runner import run_async as _run_async
    from app.models.audit import Audit, AuditStatus
    from sqlalchemy import select

    async def _fail() -> None:
        async with task_session() as session:
            result = await session.execute(select(Audit).where(Audit.id == audit_id))
            audit = result.scalar_one_or_none()
            if audit:
                audit.status = AuditStatus.failed
                audit.error_message = error
                await session.commit()

    _run_async(_fail())
    from app.workers.pipeline import publish_progress as _pp
    _pp(audit_id=audit_id, step=0, step_name="Error",
        message=error, section="CODE", status="failed")
