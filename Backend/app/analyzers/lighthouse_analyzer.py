"""
app/analyzers/lighthouse_analyzer.py
Runs Lighthouse CLI via Node.js subprocess and parses the JSON report.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import tempfile
from typing import Any, Dict

logger = logging.getLogger(__name__)


async def analyze_lighthouse(url: str) -> Dict[str, Any]:
    """
    Run `lighthouse <url> --output=json --chrome-flags='--headless'`
    and return a normalized score + key metrics.
    """
    output_file = os.path.join(tempfile.gettempdir(), f"lh_{abs(hash(url))}.json")

    cmd = [
        "lighthouse",
        url,
        "--output=json",
        f"--output-path={output_file}",
        "--chrome-flags=--headless --no-sandbox --disable-gpu",
        "--quiet",
    ]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await asyncio.wait_for(proc.communicate(), timeout=120.0)

        if not os.path.exists(output_file):
            logger.warning("Lighthouse output file not found. stderr: %s", stderr)
            return _fallback(url)

        with open(output_file, encoding="utf-8") as f:
            report = json.load(f)

        os.remove(output_file)
        return _parse_lighthouse_report(report)

    except (asyncio.TimeoutError, FileNotFoundError) as exc:
        logger.warning("Lighthouse failed for %s: %s", url, exc)
        return _fallback(url)


def _parse_lighthouse_report(report: Dict[str, Any]) -> Dict[str, Any]:
    """Parse Lighthouse JSON report into our standard format."""
    cats = report.get("categories", {})

    perf = (cats.get("performance", {}).get("score") or 0) * 100
    a11y = (cats.get("accessibility", {}).get("score") or 0) * 100
    seo = (cats.get("seo", {}).get("score") or 0) * 100
    best = (cats.get("best-practices", {}).get("score") or 0) * 100

    # Web vitals
    audits = report.get("audits", {})
    lcp = _get_metric(audits, "largest-contentful-paint")
    fid = _get_metric(audits, "total-blocking-time")   # TBT as FID proxy
    cls = _get_metric(audits, "cumulative-layout-shift")
    ttfb = _get_metric(audits, "server-response-time")

    # Composite: 60% performance, 20% a11y, 10% seo, 10% best-practices
    composite = (perf * 0.6) + (a11y * 0.2) + (seo * 0.1) + (best * 0.1)

    return {
        "raw": {
            "performance": round(perf, 1),
            "accessibility": round(a11y, 1),
            "seo": round(seo, 1),
            "best_practices": round(best, 1),
            "lcp": lcp,
            "fid": fid,
            "cls": cls,
            "ttfb": ttfb,
            "highlights": _extract_opportunities(audits),
        },
        "score": round(composite, 1),
    }


def _get_metric(audits: Dict[str, Any], key: str) -> Any:
    return audits.get(key, {}).get("displayValue", "N/A")


def _extract_opportunities(audits: Dict[str, Any]) -> list:
    """Extract top improvement opportunities."""
    opportunities = []
    for key, audit in audits.items():
        if audit.get("details", {}).get("type") == "opportunity":
            savings = audit.get("details", {}).get("overallSavingsMs", 0)
            if savings and savings > 100:
                opportunities.append({
                    "audit": key,
                    "title": audit.get("title", key),
                    "savings_ms": savings,
                })
    return sorted(opportunities, key=lambda x: -x["savings_ms"])[:5]


def _fallback(url: str) -> Dict[str, Any]:
    """Return a minimal fallback if Lighthouse is unavailable."""
    return {
        "raw": {
            "performance": 50.0,
            "accessibility": 50.0,
            "seo": 50.0,
            "best_practices": 50.0,
            "lcp": "N/A", "fid": "N/A", "cls": "N/A", "ttfb": "N/A",
            "highlights": [],
            "error": f"Lighthouse unavailable for {url}",
        },
        "score": 50.0,
    }
