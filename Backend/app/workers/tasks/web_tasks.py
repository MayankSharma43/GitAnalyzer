"""
app/workers/tasks/web_tasks.py — Step 4: Web audit via Playwright + Lighthouse.
"""
from __future__ import annotations

import logging

from app.utils.task_runner import run_async
from app.workers.celery_app import celery_app
from app.workers.pipeline import publish_progress

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.run_web_audit", bind=True)
def run_web_audit(self, audit_id: str) -> str:
    """
    Step 4 — Run Lighthouse + basic Playwright checks on live_app_url.
    Skipped if no live_app_url was provided.
    """
    from app.utils.task_db import task_session
    from app.models.audit import Audit
    from app.models.repository import Repository
    from app.models.analysis_result import AnalysisResult
    from app.analyzers.lighthouse_analyzer import analyze_lighthouse
    from sqlalchemy import select

    publish_progress(
        audit_id=audit_id,
        step=4,
        step_name="Web performance audit",
        message="Starting Lighthouse performance audit...",
        section="UIUX",
    )

    async def _run() -> None:
        async with task_session() as session:
            result = await session.execute(select(Audit).where(Audit.id == audit_id))
            audit = result.scalar_one_or_none()
            if audit is None:
                return

            live_url = audit.input_live_url
            if not live_url:
                publish_progress(
                    audit_id=audit_id,
                    step=4,
                    step_name="Web audit skipped",
                    message="No live app URL provided — skipping Lighthouse audit.",
                    section="UIUX",
                )
                return

            try:
                lh_result = await analyze_lighthouse(live_url)

                # Store as a synthetic "repository" entry for the live app
                repo_row = Repository(
                    audit_id=audit.id,
                    repo_url=live_url,
                    name=f"[live] {live_url[:80]}",
                    language="Web",
                    stars=0,
                    forks=0,
                    clone_path=None,
                )
                session.add(repo_row)
                await session.flush()

                ar = AnalysisResult(
                    repository_id=repo_row.id,
                    tool_name="lighthouse",
                    raw_output=lh_result["raw"],
                    score=lh_result["score"],
                )
                session.add(ar)
                await session.commit()

                publish_progress(
                    audit_id=audit_id,
                    step=4,
                    step_name="Web audit complete",
                    message=f"Lighthouse score: {lh_result['score']:.0f}/100",
                    section="UIUX",
                    data={"lighthouse_score": lh_result["score"]},
                )
            except Exception as exc:
                logger.error("Lighthouse audit failed for %s: %s", live_url, exc)
                publish_progress(
                    audit_id=audit_id,
                    step=4,
                    step_name="Web audit failed",
                    message=f"Lighthouse audit failed: {exc}. Continuing without web scores.",
                    section="UIUX",
                )

    run_async(_run())
    return audit_id
