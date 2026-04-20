"""
app/services/report_service.py
──────────────────────────────────────────────────────────────────────────────
Anthropic Claude report generator — assembles all analysis data into a
structured prompt and parses the LLM JSON response into our schema.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

import anthropic

from app.config import settings
from app.services.scoring import ScoringResult

logger = logging.getLogger(__name__)

CLAUDE_MODEL = "claude-3-5-sonnet-20241022"

SYSTEM_PROMPT = """You are a brutally honest senior staff engineer conducting a code review for a developer career audit platform.

Your job: analyze the provided data about a developer's GitHub profile, code quality metrics, and static analysis results, then produce a ruthless, evidence-based assessment.

Rules:
- Reference specific files, functions, and patterns from the data provided
- No corporate softening. No positive spin on fundamentally bad code
- Be specific and actionable — every criticism must have a fix
- Output ONLY valid JSON. No markdown, no preamble, no explanation outside JSON
- Calibrate harshly: most developers who think they're Senior are Mid-level

Output this exact JSON structure:
{
  "strengths": ["string", ...],
  "critical_issues": [
    {
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "file": "path/to/file.ext or null",
      "line": 42,
      "title": "Short title",
      "description": "Detailed explanation with evidence",
      "fix": "Exact actionable fix",
      "owasp": "OWASP category if applicable or null"
    }
  ],
  "recommendations": [
    {
      "rank": 1,
      "title": "Short title",
      "effort": "2h|1 day|1 week",
      "impact": "CRITICAL|HIGH|MEDIUM|LOW",
      "why": "Evidence-based justification"
    }
  ],
  "radar_data": [
    {"axis": "Code Quality", "claimed": 85, "actual": 64},
    {"axis": "Testing", "claimed": 80, "actual": 32},
    {"axis": "Security", "claimed": 75, "actual": 45},
    {"axis": "Architecture", "claimed": 85, "actual": 60},
    {"axis": "Documentation", "claimed": 70, "actual": 30},
    {"axis": "Performance", "claimed": 75, "actual": 55},
    {"axis": "DevOps", "claimed": 70, "actual": 50}
  ],
  "career_narrative": "3-5 sentence brutally honest career assessment with specific improvement path",
  "roadmap": [
    {
      "phase": "Day 1-30",
      "goals": ["Goal 1", "Goal 2"]
    }
  ],
  "job_matches": [
    {
      "title": "Role Title",
      "company": "Company Type",
      "min": 100,
      "max": 150,
      "match": 85
    }
  ],
  "resume_bullets": [
    {
      "original": "Standard resume bullet",
      "rewritten": "Brutally honest, metrics-driven bullet",
      "mismatch": false
    }
  ]
}"""


def _build_prompt(
    github_data: Dict[str, Any],
    scoring_result: ScoringResult,
    analysis_results: List[Dict[str, Any]],
    claimed_level: Optional[str],
    repo_names: List[str],
) -> str:
    profile = github_data.get("profile", {})
    lang_dist = github_data.get("language_distribution", {})
    contributions = github_data.get("contributions", {})
    total_contributions = contributions.get("contributionCalendar", {}).get("totalContributions", 0)
    prs = github_data.get("pull_requests", {})

    dimensions = scoring_result.dimensions

    # Summarize analysis results
    analysis_summary = []
    for ar in analysis_results:
        analysis_summary.append({
            "tool": ar.get("tool_name"),
            "repo": ar.get("repo_name"),
            "score": ar.get("score"),
            "highlights": ar.get("highlights", []),
        })

    prompt = f"""
# Developer Audit Data

## Profile
- GitHub Username: {profile.get('login', 'unknown')}
- Public Repos: {profile.get('public_repos', 0)}
- Followers: {profile.get('followers', 0)}
- Account Age: {profile.get('created_at', 'unknown')[:10]}
- Claimed Level: {claimed_level or 'Not specified'}

## Contribution Activity
- Total contributions (last year): {total_contributions}
- Total PRs: {prs.get('totalCount', 0)}

## Language Distribution
{json.dumps(lang_dist, indent=2)}

## Repositories Analysed
{json.dumps(repo_names, indent=2)}

## Computed Scores (0–100)
- Code Quality: {dimensions.code_quality}
- Architecture: {dimensions.architecture}
- Testing: {dimensions.testing}
- Performance: {dimensions.performance}
- Deployment: {dimensions.deployment}
- Overall: {scoring_result.overall}
- Skill Level (computed): {scoring_result.skill_level}
- Percentile: {scoring_result.percentile}th

## Static Analysis Summary
{json.dumps(analysis_summary, indent=2)}

---
Generate the audit report JSON now. Be specific, reference real patterns from the data.
"""
    return prompt.strip()


async def generate_report(
    github_data: Dict[str, Any],
    scoring_result: ScoringResult,
    analysis_results: List[Dict[str, Any]],
    claimed_level: Optional[str] = None,
    repo_names: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Call Anthropic Claude and parse the structured JSON report.
    Returns a dict matching the Report model fields.
    """
    logger.info("Calling Anthropic API (model=%s)...", CLAUDE_MODEL)

    try:
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

        prompt = _build_prompt(
            github_data=github_data,
            scoring_result=scoring_result,
            analysis_results=analysis_results,
            claimed_level=claimed_level,
            repo_names=repo_names or [],
        )

        message = await client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        raw_text = message.content[0].text if message.content else "{}"
        logger.info("Received %d chars from Anthropic", len(raw_text))
    except Exception as api_exc:
        logger.error("Anthropic API call failed: %s", api_exc)
        return {
            "strengths": ["Analysis completed — see scores."],
            "critical_issues": [],
            "recommendations": [],
            "radar_data": [],
            "career_narrative": f"Unable to load AI assessment due to this error: {api_exc}. To resolve, please check your Anthropic API key and billing plan.",
            "roadmap": [],
            "job_matches": [],
            "resume_bullets": [],
        }

    # ── Parse JSON ─────────────────────────────────────────────────────────
    try:
        # Strip any accidental markdown fences
        clean = raw_text.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        parsed = json.loads(clean.strip())
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse LLM JSON: %s\nRaw: %s", exc, raw_text[:500])
        # Return a fallback structure
        parsed = {
            "strengths": ["Analysis completed — see scores above."],
            "critical_issues": [],
            "recommendations": [],
            "radar_data": [],
            "career_narrative": "Report generation encountered a parsing error. Raw scores are accurate.",
            "roadmap": [],
            "job_matches": [],
            "resume_bullets": [],
        }

    return parsed
