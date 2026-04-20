"""
app/analyzers/pylint_analyzer.py
Runs Pylint with JSON output format on Python repos.
"""
from __future__ import annotations

import json
import logging
import subprocess
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


def analyze_pylint(repo_path: str) -> Dict[str, Any]:
    """Run pylint and return normalized score + raw output."""
    raw, score = _run_pylint(repo_path)
    highlights = _extract_highlights(raw)

    return {
        "raw": {
            "messages": raw[:50],  # Limit stored messages to top 50
            "score": score,
            "highlights": highlights,
        },
        "score": score,
    }


def _run_pylint(path: str) -> tuple[List[Dict[str, Any]], float]:
    """Run pylint --output-format=json on the repo directory."""
    try:
        result = subprocess.run(
            [
                "pylint",
                path,
                "--output-format=json",
                "--recursive=y",
                "--disable=C0114,C0115,C0116",  # Ignore missing docstrings for scoring
                "--from-stdin=n",
            ],
            capture_output=True,
            text=True,
            timeout=180,
        )

        messages = []
        if result.stdout.strip():
            try:
                messages = json.loads(result.stdout)
            except json.JSONDecodeError:
                pass

        # Extract score from stderr (pylint always prints it there)
        score = _parse_score_from_stderr(result.stderr)
        return messages, score

    except (subprocess.TimeoutExpired, FileNotFoundError) as exc:
        logger.warning("pylint failed: %s", exc)
        return [], 5.0


def _parse_score_from_stderr(stderr: str) -> float:
    """Parse 'Your code has been rated at X.XX/10' from pylint stderr."""
    import re
    match = re.search(r"rated at ([\d.]+)/10", stderr)
    if match:
        return float(match.group(1))
    return 5.0


def _extract_highlights(messages: List[Dict[str, Any]]) -> List[str]:
    """Extract top error-level messages as strings."""
    errors = [m for m in messages if m.get("type") in ("error", "fatal")]
    result = []
    for m in errors[:10]:
        path = m.get("path", "?")
        line = m.get("line", "?")
        msg = m.get("message", "?")
        result.append(f"{path}:{line} — {msg}")
    return result
