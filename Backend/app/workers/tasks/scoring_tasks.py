"""
app/workers/tasks/scoring_tasks.py — Step 5: Score the developer.
"""
from __future__ import annotations

import logging
from typing import List, Optional

from app.utils.task_runner import run_async
from app.workers.celery_app import celery_app
from app.workers.pipeline import publish_progress

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.score_developer", bind=True)
def score_developer(self, audit_id: str) -> str:
    """
    Step 5 — Aggregate all analysis results into dimension scores,
    compute overall score, skill level, and percentile.
    Stores a Report row (without LLM narrative yet).
    """
    from app.utils.task_db import task_session
    from app.models.audit import Audit
    from app.models.repository import Repository
    from app.models.analysis_result import AnalysisResult
    from app.models.report import Report, SkillLevel
    from app.services.scoring import ScoringEngine
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    publish_progress(
        audit_id=audit_id,
        step=5,
        step_name="Computing skill scores",
        message="Running weighted scoring algorithm...",
        section="JOBS",
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

            engine = ScoringEngine()

            # ── Collect analysis results ───────────────────────────────
            radon_cc_scores: List[float] = []
            radon_mi_scores: List[float] = []
            pylint_scores: List[float] = []
            eslint_errors = 0
            eslint_warnings = 0
            eslint_loc = 1000
            semgrep_findings = 0
            semgrep_loc = 1000
            lighthouse_scores: List[float] = []
            repo_paths: List[str] = []

            for repo in audit.repositories:
                if repo.clone_path:
                    repo_paths.append(repo.clone_path)
                for ar in repo.analysis_results:
                    raw = ar.raw_output or {}
                    if ar.tool_name == "radon":
                        cc = raw.get("avg_complexity")
                        mi = raw.get("avg_mi")
                        if cc is not None:
                            radon_cc_scores.append(float(cc))
                        if mi is not None:
                            radon_mi_scores.append(float(mi))
                    elif ar.tool_name == "pylint":
                        if ar.score is not None:
                            pylint_scores.append(ar.score)
                    elif ar.tool_name == "eslint":
                        eslint_errors += raw.get("errors", 0)
                        eslint_warnings += raw.get("warnings", 0)
                        eslint_loc = max(eslint_loc, raw.get("lines_of_code", 1000))
                    elif ar.tool_name == "semgrep":
                        semgrep_findings += raw.get("findings_count", 0)
                        semgrep_loc = max(semgrep_loc, raw.get("lines_of_code", 1000))
                    elif ar.tool_name == "lighthouse":
                        if ar.score is not None:
                            lighthouse_scores.append(ar.score)

            scoring_result = engine.score(
                radon_avg_cc=sum(radon_cc_scores) / len(radon_cc_scores) if radon_cc_scores else None,
                radon_avg_mi=sum(radon_mi_scores) / len(radon_mi_scores) if radon_mi_scores else None,
                pylint_score=sum(pylint_scores) / len(pylint_scores) if pylint_scores else None,
                eslint_errors=eslint_errors,
                eslint_warnings=eslint_warnings,
                eslint_loc=eslint_loc,
                semgrep_findings=semgrep_findings,
                semgrep_loc=semgrep_loc,
                lighthouse_score=sum(lighthouse_scores) / len(lighthouse_scores) if lighthouse_scores else None,
                repo_paths=repo_paths,
            )

            dim = scoring_result.dimensions

            # Map skill level string to enum
            skill_map = {
                "Junior": SkillLevel.junior,
                "Mid-level": SkillLevel.mid_level,
                "Senior": SkillLevel.senior,
            }
            skill_level_enum = skill_map.get(scoring_result.skill_level, SkillLevel.junior)

            # Create or update Report row (without LLM data yet)
            existing = await session.execute(
                select(Report).where(Report.audit_id == audit.id)
            )
            report = existing.scalar_one_or_none()
            if report is None:
                report = Report(audit_id=audit.id)
                session.add(report)

            report.skill_level = skill_level_enum
            report.code_quality_score = dim.code_quality
            report.architecture_score = dim.architecture
            report.testing_score = dim.testing
            report.performance_score = dim.performance
            report.deployment_score = dim.deployment
            report.overall_score = scoring_result.overall
            report.percentile = scoring_result.percentile

            await session.commit()

            publish_progress(
                audit_id=audit_id,
                step=5,
                step_name="Scoring complete",
                message=f"Overall score: {scoring_result.overall}/100 — {scoring_result.skill_level} ({scoring_result.percentile}th percentile)",
                section="JOBS",
                data={
                    "overall": scoring_result.overall,
                    "skill_level": scoring_result.skill_level,
                    "percentile": scoring_result.percentile,
                    "code_quality": dim.code_quality,
                    "architecture": dim.architecture,
                    "testing": dim.testing,
                    "performance": dim.performance,
                    "deployment": dim.deployment,
                },
            )

    run_async(_run())
    return audit_id
