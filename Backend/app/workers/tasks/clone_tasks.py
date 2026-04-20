"""
app/workers/tasks/clone_tasks.py — Step 2: Clone top repos.
"""
from __future__ import annotations

import logging
import os
import shutil
import tempfile
from typing import List

from app.utils.task_runner import run_async
from app.workers.celery_app import celery_app
from app.workers.pipeline import publish_progress

logger = logging.getLogger(__name__)

MAX_REPOS = 5
CLONE_BASE = tempfile.gettempdir()


def _count_extensions(repo_path: str) -> dict[str, int]:
    """Count source file extensions to determine primary language."""
    EXT_TO_LANG = {
        ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript",
        ".jsx": "TypeScript", ".tsx": "TypeScript", ".go": "Go",
        ".rs": "Rust", ".java": "Java", ".rb": "Ruby",
        ".php": "PHP", ".cs": "C#", ".cpp": "C++", ".c": "C",
        ".swift": "Swift", ".kt": "Kotlin", ".scala": "Scala",
        ".r": "R", ".m": "Objective-C", ".vue": "Vue",
    }
    counts: dict[str, int] = {}
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".git", "__pycache__", "venv", ".venv", "dist", "build")]
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            lang = EXT_TO_LANG.get(ext)
            if lang:
                counts[lang] = counts.get(lang, 0) + 1
    return counts


def _detect_language(repo_path: str, github_lang: str | None) -> str:
    """Detect primary language from file extension counts."""
    counts = _count_extensions(repo_path)
    if not counts:
        return github_lang or "Unknown"
    return max(counts, key=lambda k: counts[k])


@celery_app.task(name="tasks.clone_repositories", bind=True, max_retries=1)
def clone_repositories(self, audit_id: str) -> str:
    """
    Step 2 — Clone top 5 repos into /tmp/audit_{audit_id}/
    Uses git clone (shallow, depth=1 for speed).
    """
    from app.utils.task_db import task_session
    from app.models.audit import Audit
    from app.models.repository import Repository
    from sqlalchemy import select
    import git as gitlib

    publish_progress(
        audit_id=audit_id,
        step=2,
        step_name="Cloning repositories",
        message="Cloning top repositories for static analysis...",
        section="CODE",
    )

    async def _run() -> None:
        async with task_session() as session:
            result = await session.execute(select(Audit).where(Audit.id == audit_id))
            audit = result.scalar_one_or_none()
            if audit is None or audit.github_data is None:
                raise ValueError(f"Audit {audit_id} not found or has no GitHub data")

            github_data = audit.github_data
            top_repos = github_data.get("top_repos", [])[:MAX_REPOS]

            # Additional repo URLs from user input
            extra_urls: List[str] = audit.input_repo_urls or []

            clone_dir = os.path.join(CLONE_BASE, f"audit_{audit_id}")
            os.makedirs(clone_dir, exist_ok=True)

            cloned = 0
            for repo_meta in top_repos:
                repo_name = repo_meta.get("name", "")
                clone_url = repo_meta.get("clone_url") or repo_meta.get("html_url", "")
                if not clone_url:
                    continue

                dest = os.path.join(clone_dir, repo_name)
                try:
                    if not os.path.exists(dest):
                        gitlib.Repo.clone_from(
                            clone_url,
                            dest,
                            depth=1,
                            env={"GIT_TERMINAL_PROMPT": "0"},
                        )
                    language = _detect_language(dest, repo_meta.get("language"))
                    repo_row = Repository(
                        audit_id=audit.id,
                        repo_url=repo_meta.get("html_url", clone_url),
                        name=repo_name,
                        language=language,
                        stars=repo_meta.get("stargazers_count", 0),
                        forks=repo_meta.get("forks_count", 0),
                        clone_path=dest,
                    )
                    session.add(repo_row)
                    cloned += 1
                    logger.info("Cloned %s → %s", repo_name, dest)
                except Exception as exc:
                    logger.warning("Failed to clone %s: %s", clone_url, exc)

            await session.commit()

            publish_progress(
                audit_id=audit_id,
                step=2,
                step_name="Cloning repositories",
                message=f"Successfully cloned {cloned} repositories.",
                section="CODE",
                data={"cloned": cloned},
            )

    try:
        run_async(_run())
    except Exception as exc:
        logger.error("clone_repositories failed for %s: %s", audit_id, exc)
        raise

    return audit_id
