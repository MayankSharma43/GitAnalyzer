"""
app/analyzers/eslint_analyzer.py
Runs ESLint with JSON output on JS/TS repos.
Falls back gracefully if ESLint is not installed or project has no config.
"""
from __future__ import annotations

import json
import logging
import os
import subprocess
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

# Inline minimal ESLint config if the project has none
MINIMAL_CONFIG = """{
  "env": { "browser": true, "es2021": true, "node": true },
  "extends": ["eslint:recommended"],
  "parserOptions": { "ecmaVersion": "latest", "sourceType": "module" },
  "rules": {
    "no-unused-vars": "warn",
    "no-undef": "error",
    "prefer-const": "warn",
    "no-var": "warn"
  }
}
"""


def analyze_eslint(repo_path: str) -> Dict[str, Any]:
    """Run ESLint and return a normalized score."""
    errors, warnings, loc, raw = _run_eslint(repo_path)
    highlights = _extract_highlights(raw)

    return {
        "raw": {
            "errors": errors,
            "warnings": warnings,
            "lines_of_code": loc,
            "highlights": highlights,
            "findings_count": errors + warnings,
        },
        "score": _normalize(errors, warnings, loc),
    }


def _normalize(errors: int, warnings: int, loc: int) -> float:
    if loc <= 0:
        loc = 1000
    density = ((errors * 2) + warnings) / (loc / 1000.0)
    return round(max(0.0, min(100.0, 100.0 - (density * 2.0))), 1)


def _count_loc(repo_path: str) -> int:
    """Count lines in JS/TS/JSX/TSX files."""
    exts = {".js", ".ts", ".jsx", ".tsx"}
    total = 0
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".git", "dist", "build")]
        for f in files:
            if os.path.splitext(f)[1].lower() in exts:
                try:
                    with open(os.path.join(root, f), encoding="utf-8", errors="ignore") as fh:
                        total += sum(1 for _ in fh)
                except OSError:
                    pass
    return max(total, 100)


def _run_eslint(path: str) -> tuple[int, int, int, List[Dict[str, Any]]]:
    """Run ESLint and parse JSON output. Returns (errors, warnings, loc, raw)."""
    loc = _count_loc(path)

    # Check if ESLint config exists
    config_files = {
        ".eslintrc", ".eslintrc.js", ".eslintrc.json", ".eslintrc.yml",
        ".eslintrc.cjs", "eslint.config.js", "eslint.config.mjs",
    }
    has_config = any(
        os.path.exists(os.path.join(path, cf)) for cf in config_files
    )

    cmd = ["npx", "--yes", "eslint", ".", "--format=json", "--ext", ".js,.ts,.jsx,.tsx"]
    if not has_config:
        # Write a temp config
        tmp_config = os.path.join(path, ".eslintrc.json.tmp")
        with open(tmp_config, "w") as f:
            f.write(MINIMAL_CONFIG)
        os.rename(tmp_config, os.path.join(path, ".eslintrc.json.tmp_active"))
        cmd = ["npx", "--yes", "eslint", ".", "--format=json",
               "--ext", ".js,.ts,.jsx,.tsx",
               "--no-eslintrc", "--config", os.path.join(path, ".eslintrc.json.tmp_active")]

    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=120, cwd=path,
        )
        # ESLint exits 1 if there are errors - that's expected
        raw_output = []
        if result.stdout.strip():
            try:
                raw_output = json.loads(result.stdout)
            except json.JSONDecodeError:
                pass

        total_errors = sum(r.get("errorCount", 0) for r in raw_output)
        total_warnings = sum(r.get("warningCount", 0) for r in raw_output)
        return total_errors, total_warnings, loc, raw_output

    except (subprocess.TimeoutExpired, FileNotFoundError) as exc:
        logger.warning("ESLint failed: %s", exc)
        return 0, 0, loc, []
    finally:
        # Clean up temp config
        tmp = os.path.join(path, ".eslintrc.json.tmp_active")
        if os.path.exists(tmp):
            os.remove(tmp)


def _extract_highlights(raw: List[Dict[str, Any]]) -> List[str]:
    """Extract top error messages."""
    highlights = []
    for file_result in raw[:20]:
        for msg in file_result.get("messages", []):
            if msg.get("severity") == 2:  # error
                fp = file_result.get("filePath", "?")
                line = msg.get("line", "?")
                text = msg.get("message", "?")
                rule = msg.get("ruleId", "?")
                highlights.append(f"{fp}:{line} [{rule}] {text}")
                if len(highlights) >= 10:
                    return highlights
    return highlights
