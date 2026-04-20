"""
app/workers/tasks/report_tasks.py — Step 6: Generate AI report with Anthropic.
"""
from __future__ import annotations

import datetime
import logging
from typing import Any, Dict, List

from app.utils.task_runner import run_async
from app.workers.celery_app import celery_app
from app.workers.pipeline import publish_progress

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.generate_report", bind=True, max_retries=2)
def generate_report(self, audit_id: str) -> str:
    """
    Step 6 — Call Anthropic Claude to generate structured JSON report.
    Updates Report row with narrative and structured data.
    Marks audit as completed.
    """
    from app.utils.task_db import task_session
    from app.models.audit import Audit, AuditStatus
    from app.models.repository import Repository
    from app.models.analysis_result import AnalysisResult
    from app.models.report import Report
    from app.services.report_service import generate_report as gen_report
    from app.services.scoring import ScoringResult, DimensionScores
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    publish_progress(
        audit_id=audit_id,
        step=6,
        step_name="Generating AI report",
        message="Calling Claude to write your brutally honest assessment...",
        section="ROADMAP",
    )

    async def _run() -> None:
        async with task_session() as session:
            result = await session.execute(
                select(Audit)
                .where(Audit.id == audit_id)
                .options(selectinload(Audit.repositories).selectinload(Repository.analysis_results))
            )
            audit = result.scalar_one_or_none()
            if audit is None:
                raise ValueError(f"Audit {audit_id} not found")

            rpt_result = await session.execute(
                select(Report).where(Report.audit_id == audit.id)
            )
            report = rpt_result.scalar_one_or_none()
            if report is None:
                raise ValueError(f"Report row missing for audit {audit_id}")

            # ── Build context ──────────────────────────────────────────
            github_data = audit.github_data or {}
            repo_names = [r.name for r in audit.repositories]

            # Collect highlights per tool
            analysis_results: List[Dict[str, Any]] = []
            for repo in audit.repositories:
                for ar in repo.analysis_results:
                    raw = ar.raw_output or {}
                    analysis_results.append({
                        "tool_name": ar.tool_name,
                        "repo_name": repo.name,
                        "score": ar.score,
                        "highlights": raw.get("highlights", []),
                        "findings_count": raw.get("findings_count", 0),
                    })

            # Re-construct scoring result from stored report
            from app.services.scoring import ScoringResult, DimensionScores
            scoring_result = ScoringResult(
                dimensions=DimensionScores(
                    code_quality=report.code_quality_score,
                    architecture=report.architecture_score,
                    testing=report.testing_score,
                    performance=report.performance_score,
                    deployment=report.deployment_score,
                ),
                overall=report.overall_score,
                skill_level=report.skill_level.value,
                percentile=report.percentile,
            )

            # ── Call Anthropic ─────────────────────────────────────────
            llm_data = await gen_report(
                github_data=github_data,
                scoring_result=scoring_result,
                analysis_results=analysis_results,
                claimed_level=audit.claimed_level,
                repo_names=repo_names,
            )

            # ── Persist LLM data ───────────────────────────────────────
            report.strengths = llm_data.get("strengths", [])
            report.critical_issues = llm_data.get("critical_issues", [])
            report.recommendations = llm_data.get("recommendations", [])
            report.radar_data = llm_data.get("radar_data", [])
            report.llm_narrative = llm_data.get("career_narrative", "")

            # ── Mark audit completed ───────────────────────────────────
            audit.status = AuditStatus.completed
            audit.completed_at = datetime.datetime.utcnow()

            await session.commit()

        publish_progress(
            audit_id=audit_id,
            step=6,
            step_name="Report complete",
            message="Your brutal truth is ready. Routing to dashboard...",
            section="RESUME",
            status="completed",
            data={"audit_id": audit_id},
        )

    try:
        run_async(_run())
    except Exception as exc:
        logger.error("generate_report failed for %s: %s", audit_id, exc)
        try:
            self.retry(exc=exc, countdown=10)
        except self.MaxRetriesExceededError:
            _mark_failed(audit_id, str(exc))
            raise

    return audit_id


def _mark_failed(audit_id: str, error: str) -> None:
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
    _pp(audit_id=audit_id, step=6, step_name="Failed",
        message=error, section="RESUME", status="failed")
