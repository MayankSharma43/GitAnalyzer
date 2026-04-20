"""
app/analyzers/semgrep_analyzer.py
Runs Semgrep with p/security and p/owasp rulesets.
"""
from __future__ import annotations

import json
import logging
import os
import subprocess
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

RULESETS = ["p/security-audit", "p/owasp-top-ten"]


def analyze_semgrep(repo_path: str) -> Dict[str, Any]:
    """Run Semgrep and return normalized score + raw findings."""
    findings, loc = _run_semgrep(repo_path)
    highlights = _extract_highlights(findings)
    score = _normalize(len(findings), loc)

    return {
        "raw": {
            "findings_count": len(findings),
            "findings": findings[:30],  # Store top 30 only
            "lines_of_code": loc,
            "highlights": highlights,
        },
        "score": score,
    }


def _count_loc(repo_path: str) -> int:
    total = 0
    skip_dirs = {"node_modules", ".git", "__pycache__", "venv", ".venv", "dist", "build"}
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in (".py", ".js", ".ts", ".go", ".java", ".rb", ".php", ".rs"):
                try:
                    with open(os.path.join(root, f), encoding="utf-8", errors="ignore") as fh:
                        total += sum(1 for _ in fh)
                except OSError:
                    pass
    return max(total, 500)


def _run_semgrep(path: str) -> tuple[List[Dict[str, Any]], int]:
    loc = _count_loc(path)
    rules = ",".join(RULESETS)

    try:
        result = subprocess.run(
            [
                "semgrep",
                "--config", rules,
                "--json",
                "--timeout", "60",
                "--max-memory", "1000",
                path,
            ],
            capture_output=True,
            text=True,
            timeout=180,
            env={**os.environ, "SEMGREP_SEND_METRICS": "off"},
        )

        output = {}
        if result.stdout.strip():
            try:
                output = json.loads(result.stdout)
            except json.JSONDecodeError:
                pass

        findings = output.get("results", [])
        return findings, loc

    except (subprocess.TimeoutExpired, FileNotFoundError) as exc:
        logger.warning("Semgrep failed: %s", exc)
        return [], loc


def _normalize(findings: int, loc: int) -> float:
    if loc <= 0:
        loc = 500
    density = findings / (loc / 1000.0)
    return round(max(0.0, min(100.0, 100.0 - (density * 5.0))), 1)


def _extract_highlights(findings: List[Dict[str, Any]]) -> List[str]:
    highlights = []
    for f in findings[:10]:
        path = f.get("path", "?")
        line = f.get("start", {}).get("line", "?")
        msg = f.get("extra", {}).get("message", "?")
        rule = f.get("check_id", "?").split(".")[-1]
        highlights.append(f"{path}:{line} [{rule}] {msg[:120]}")
    return highlights
