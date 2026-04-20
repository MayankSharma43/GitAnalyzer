"""
app/analyzers/radon_analyzer.py
Runs Radon cyclomatic complexity + maintainability index on Python repos.
"""
from __future__ import annotations

import json
import logging
import subprocess
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


def analyze_radon(repo_path: str) -> Dict[str, Any]:
    """
    Run radon cc (cyclomatic complexity) and radon mi (maintainability index).
    Returns normalized scores + raw output.
    """
    cc_raw = _run_radon_cc(repo_path)
    mi_raw = _run_radon_mi(repo_path)

    avg_cc = _parse_avg_cc(cc_raw)
    avg_mi = _parse_avg_mi(mi_raw)

    highlights = _extract_cc_highlights(cc_raw)

    return {
        "raw": {
            "cc": cc_raw,
            "mi": mi_raw,
            "avg_complexity": avg_cc,
            "avg_mi": avg_mi,
            "highlights": highlights,
        },
        "score": avg_mi,  # Use MI as the primary score
    }


def _run_radon_cc(path: str) -> List[Dict[str, Any]]:
    """radon cc -j -a <path>"""
    try:
        result = subprocess.run(
            ["radon", "cc", "-j", "-a", path],
            capture_output=True, text=True, timeout=120,
        )
        return json.loads(result.stdout) if result.stdout.strip() else {}
    except (subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError) as exc:
        logger.warning("radon cc failed: %s", exc)
        return {}


def _run_radon_mi(path: str) -> Dict[str, Any]:
    """radon mi -j <path>"""
    try:
        result = subprocess.run(
            ["radon", "mi", "-j", path],
            capture_output=True, text=True, timeout=120,
        )
        return json.loads(result.stdout) if result.stdout.strip() else {}
    except (subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError) as exc:
        logger.warning("radon mi failed: %s", exc)
        return {}


def _parse_avg_cc(cc_data: Any) -> float:
    """Extract average complexity from radon cc JSON output."""
    if not cc_data or not isinstance(cc_data, dict):
        return 5.0  # Default: moderate
    complexities = []
    for file_data in cc_data.values():
        if isinstance(file_data, list):
            for fn in file_data:
                c = fn.get("complexity")
                if c is not None:
                    complexities.append(float(c))
    if not complexities:
        return 5.0
    return round(sum(complexities) / len(complexities), 2)


def _parse_avg_mi(mi_data: Any) -> float:
    """Extract average maintainability index from radon mi JSON output."""
    if not mi_data or not isinstance(mi_data, dict):
        return 50.0
    scores = [v.get("mi", 50.0) for v in mi_data.values() if isinstance(v, dict) and "mi" in v]
    if not scores:
        return 50.0
    return round(sum(scores) / len(scores), 2)


def _extract_cc_highlights(cc_data: Any) -> List[str]:
    """Extract worst offenders (complexity > 10) as string highlights."""
    highlights = []
    if not cc_data or not isinstance(cc_data, dict):
        return highlights
    for filepath, functions in cc_data.items():
        if not isinstance(functions, list):
            continue
        for fn in functions:
            cc = fn.get("complexity", 0)
            if cc > 10:
                name = fn.get("name", "?")
                line = fn.get("lineno", "?")
                highlights.append(f"{filepath}:{line} — {name}() complexity={cc}")
    return highlights[:10]  # Top 10 worst
