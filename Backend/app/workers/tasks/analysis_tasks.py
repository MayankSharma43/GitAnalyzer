"""
app/workers/tasks/analysis_tasks.py — Step 3: Run static analysis.
"""
from __future__ import annotations

import logging

from app.utils.task_runner import run_async
from app.workers.celery_app import celery_app
from app.workers.pipeline import publish_progress

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.run_static_analysis", bind=True)
def run_static_analysis(self, audit_id: str) -> str:
    """
    Step 3 — Run Radon, Pylint, ESLint, and Semgrep on cloned repos.
    Stores normalized results in analysis_results table.
    """
    from app.utils.task_db import task_session
    from app.models.audit import Audit
    from app.models.analysis_result import AnalysisResult
    from app.models.repository import Repository
    from sqlalchemy import select
    from app.analyzers.radon_analyzer import analyze_radon
    from app.analyzers.pylint_analyzer import analyze_pylint
    from app.analyzers.eslint_analyzer import analyze_eslint
    from app.analyzers.semgrep_analyzer import analyze_semgrep

    publish_progress(
        audit_id=audit_id,
        step=3,
        step_name="Running static analysis",
        message="Running Radon, Pylint, ESLint, and Semgrep...",
        section="CODE",
    )

    async def _run() -> None:
        async with task_session() as session:
            result = await session.execute(
                select(Repository).where(Repository.audit_id == audit_id)
            )
            repos = result.scalars().all()

            if not repos:
                logger.warning("No repositories found for audit %s", audit_id)
                return

            for repo in repos:
                if not repo.clone_path:
                    continue

                lang = (repo.language or "").lower()
                path = repo.clone_path

                # ── Python repos ───────────────────────────────────────
                if lang == "python":
                    try:
                        radon_result = analyze_radon(path)
                        ar = AnalysisResult(
                            repository_id=repo.id,
                            tool_name="radon",
                            raw_output=radon_result["raw"],
                            score=radon_result["score"],
                        )
                        session.add(ar)
                    except Exception as exc:
                        logger.warning("Radon failed on %s: %s", repo.name, exc)

                    try:
                        pylint_result = analyze_pylint(path)
                        ar = AnalysisResult(
                            repository_id=repo.id,
                            tool_name="pylint",
                            raw_output=pylint_result["raw"],
                            score=pylint_result["score"],
                        )
                        session.add(ar)
                    except Exception as exc:
                        logger.warning("Pylint failed on %s: %s", repo.name, exc)

                # ── JS/TS repos ────────────────────────────────────────
                elif lang in ("javascript", "typescript"):
                    try:
                        eslint_result = analyze_eslint(path)
                        ar = AnalysisResult(
                            repository_id=repo.id,
                            tool_name="eslint",
                            raw_output=eslint_result["raw"],
                            score=eslint_result["score"],
                        )
                        session.add(ar)
                    except Exception as exc:
                        logger.warning("ESLint failed on %s: %s", repo.name, exc)

                # ── All repos: Semgrep security scan ──────────────────
                try:
                    semgrep_result = analyze_semgrep(path)
                    ar = AnalysisResult(
                        repository_id=repo.id,
                        tool_name="semgrep",
                        raw_output=semgrep_result["raw"],
                        score=semgrep_result["score"],
                    )
                    session.add(ar)
                except Exception as exc:
                    logger.warning("Semgrep failed on %s: %s", repo.name, exc)

            await session.commit()

        publish_progress(
            audit_id=audit_id,
            step=3,
            step_name="Static analysis complete",
            message=f"Analyzed {len(repos)} repositories with 4 tools.",
            section="SECURITY",
            data={"repos_analyzed": len(repos)},
        )

    run_async(_run())
    return audit_id
