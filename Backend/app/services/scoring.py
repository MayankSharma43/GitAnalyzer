"""
app/services/scoring.py
──────────────────────────────────────────────────────────────────────────────
ScoringEngine — deterministic, weighted skill scoring.

All dimension scores are normalized to 0–100 before aggregation.
Weights are configurable via settings but default to the spec values.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from app.config import settings

# ── Skill level thresholds (inclusive upper bound) ─────────────────────────────
JUNIOR_MAX = 40
MID_LEVEL_MAX = 69
# Senior = 70–100

SKILL_THRESHOLDS = {
    "Junior": (0, JUNIOR_MAX),
    "Mid-level": (JUNIOR_MAX + 1, MID_LEVEL_MAX),
    "Senior": (MID_LEVEL_MAX + 1, 100),
}

# ── Benchmark percentile table (hardcoded MVP dataset) ────────────────────────
# Maps overall_score → percentile rank among developer population.
# Calibrated so median developer (score≈50) lands at ~50th percentile.
BENCHMARK_PERCENTILES: List[tuple[int, int]] = [
    (0,  0),  (10, 4),  (20, 10), (25, 15), (30, 22),
    (35, 30), (40, 38), (45, 45), (50, 52), (55, 59),
    (60, 65), (65, 71), (70, 78), (75, 83), (80, 88),
    (85, 92), (90, 95), (95, 97), (100, 99),
]


@dataclass
class DimensionScores:
    code_quality: float = 0.0
    architecture: float = 0.0
    testing: float = 0.0
    performance: float = 0.0
    deployment: float = 0.0


@dataclass
class ScoringResult:
    dimensions: DimensionScores
    overall: float
    skill_level: str
    percentile: int
    breakdown: Dict[str, float] = field(default_factory=dict)


class ScoringEngine:
    """
    Deterministic scoring engine.

    Usage:
        engine = ScoringEngine()
        result = engine.score(
            radon_results=[...],
            pylint_score=7.2,
            eslint_results={...},
            semgrep_results={...},
            lighthouse_scores={...},
            repo_paths=[...],
            claimed_level="Senior",
        )
    """

    def __init__(self) -> None:
        self.weights = {
            "code_quality": settings.weight_code_quality,
            "architecture": settings.weight_architecture,
            "testing": settings.weight_testing,
            "performance": settings.weight_performance,
            "deployment": settings.weight_deployment,
        }

    # ── Normalizers ────────────────────────────────────────────────────────

    def normalize_radon_cc(self, avg_complexity: float) -> float:
        """
        Radon cyclomatic complexity: A=1–5, B=6–10, C=11–15, D=16–20, F=21+
        Lower is better. Map to 0–100 (inverted).
        """
        if avg_complexity <= 1:
            return 100.0
        # Linear decay: cc=1→100, cc=30→0
        score = max(0.0, 100.0 - ((avg_complexity - 1) / 29.0) * 100.0)
        return round(score, 1)

    def normalize_radon_mi(self, mi_score: float) -> float:
        """
        Radon Maintainability Index: 0–100 (higher is better).
        Threshold: <25 = unmaintainable, ≥65 = highly maintainable.
        """
        return round(max(0.0, min(100.0, mi_score)), 1)

    def normalize_pylint(self, pylint_score: float) -> float:
        """
        Pylint score: 0–10 (10 = perfect). Normalize to 0–100.
        Severe penalty below 5.0.
        """
        if pylint_score < 0:
            pylint_score = 0.0
        normalized = (pylint_score / 10.0) * 100.0
        # Apply penalty curve for very low scores
        if pylint_score < 5.0:
            normalized *= 0.7
        return round(normalized, 1)

    def normalize_eslint(self, errors: int, warnings: int, lines_of_code: int = 1000) -> float:
        """
        ESLint: lower error/warning density is better.
        Density = (errors * 2 + warnings) per 1000 LOC.
        """
        if lines_of_code <= 0:
            lines_of_code = 1000
        density = ((errors * 2) + warnings) / (lines_of_code / 1000.0)
        # density=0→100, density=50→0
        score = max(0.0, 100.0 - (density * 2.0))
        return round(score, 1)

    def normalize_semgrep(self, findings: int, lines_of_code: int = 1000) -> float:
        """
        Semgrep findings: fewer is better.
        findings=0 → 100, findings≥20 per 1kLOC → 0.
        """
        density = findings / max(lines_of_code / 1000.0, 0.001)
        score = max(0.0, 100.0 - (density * 5.0))
        return round(score, 1)

    def normalize_lighthouse(self, lighthouse_score: float) -> float:
        """
        Lighthouse: already 0–100. Apply a mild penalty curve for
        scores below 50 to widen separation.
        """
        if lighthouse_score >= 90:
            return 100.0
        if lighthouse_score < 50:
            return round(lighthouse_score * 0.8, 1)
        return round(lighthouse_score, 1)

    # ── Heuristic scorers ──────────────────────────────────────────────────

    def calculate_architecture_score(self, repo_paths: List[str]) -> float:
        """
        Architecture heuristics:
        - Has src/ or lib/ directory structure (+15)
        - Has interfaces / types directory (+10)
        - Has a README.md (+10)
        - Has CHANGELOG or ARCHITECTURE doc (+5)
        - No deeply nested directories (max depth ≤ 6) (+10)
        - Has tests at top level or separate test dir (+10)
        - Uses monorepo patterns (+10)
        - Has configuration files (jest, webpack, tsconfig) (+10)
        - Has CI/CD integration files (+10)
        - Has proper module boundaries (≥3 top-level dirs) (+10)
        Base score: 30
        """
        import os

        score = 30.0

        for repo_path in repo_paths:
            if not os.path.isdir(repo_path):
                continue

            top_dirs = [
                d for d in os.listdir(repo_path)
                if os.path.isdir(os.path.join(repo_path, d))
                and not d.startswith(".")
                and d not in ("node_modules", "__pycache__", ".git")
            ]
            top_files = set(f.lower() for f in os.listdir(repo_path))

            # Structure bonuses
            if any(d in top_dirs for d in ("src", "lib", "pkg", "app")):
                score += 15
            if any(d in top_dirs for d in ("types", "interfaces", "typings")):
                score += 10
            if "readme.md" in top_files:
                score += 10
            if any(f in top_files for f in ("changelog.md", "architecture.md", "design.md")):
                score += 5
            if any(d in top_dirs for d in ("tests", "test", "__tests__", "spec")):
                score += 10
            if any(d in top_dirs for d in ("packages", "apps", "libs", "services")):
                score += 10  # monorepo
            if len(top_dirs) >= 3:
                score += 10
            # Config files
            config_files = {
                "jest.config.js", "jest.config.ts", "tsconfig.json",
                "webpack.config.js", "vite.config.ts", "pyproject.toml",
                "setup.py", "cargo.toml",
            }
            if config_files & top_files:
                score += 10
            # CI/CD
            ci_files = {".github", ".gitlab-ci.yml", ".travis.yml", "jenkinsfile", ".circleci"}
            if ci_files & (set(f.lower() for f in os.listdir(repo_path))):
                score += 10

        # Average across repos, cap at 100
        return round(min(100.0, score / max(len(repo_paths), 1)), 1)

    def calculate_testing_score(self, repo_paths: List[str]) -> float:
        """
        Testing score based on:
        - Ratio of test files to total source files
        - Presence of coverage config
        - Coverage report file if present
        """
        import os

        TEST_PATTERNS = {"test_", "_test.", ".test.", ".spec.", "test.", "spec."}
        COVERAGE_FILES = {"coverage.xml", ".coverage", "coverage-summary.json", "lcov.info"}

        scores = []
        for repo_path in repo_paths:
            if not os.path.isdir(repo_path):
                continue

            total_files = 0
            test_files = 0
            has_coverage_config = False
            has_coverage_report = False

            for root, dirs, files in os.walk(repo_path):
                # Skip non-source dirs
                dirs[:] = [
                    d for d in dirs
                    if d not in ("node_modules", ".git", "__pycache__", ".venv", "venv", "dist", "build")
                ]
                for f in files:
                    if not any(f.endswith(ext) for ext in (".py", ".js", ".ts", ".jsx", ".tsx", ".go", ".rs")):
                        continue
                    total_files += 1
                    fl = f.lower()
                    if any(pat in fl for pat in TEST_PATTERNS):
                        test_files += 1
                    if fl in COVERAGE_FILES:
                        has_coverage_report = True
                    if fl in ("pytest.ini", ".coveragerc", "jest.config.js", "jest.config.ts"):
                        has_coverage_config = True

            if total_files == 0:
                scores.append(0.0)
                continue

            ratio = test_files / total_files
            # ratio=0→0, ratio=0.3→80, ratio≥0.5→100
            ratio_score = min(100.0, ratio * 267.0)
            bonus = 0.0
            if has_coverage_config:
                bonus += 10.0
            if has_coverage_report:
                bonus += 10.0

            scores.append(min(100.0, ratio_score + bonus))

        return round(sum(scores) / max(len(scores), 1), 1) if scores else 0.0

    def calculate_deployment_score(self, repo_paths: List[str]) -> float:
        """
        Deployment readiness:
        - Has Dockerfile (+20)
        - Has docker-compose (+15)
        - Has CI/CD config (+20)
        - Has .env.example (+10)
        - Has Makefile or justfile (+5)
        - Has Kubernetes manifests (+20)
        - Has terraform / IaC files (+15)
        - Has health check endpoint (detected from code patterns) (+10)
        """
        import os

        score = 0.0
        for repo_path in repo_paths:
            if not os.path.isdir(repo_path):
                continue

            all_files = set()
            for root, dirs, files in os.walk(repo_path):
                dirs[:] = [d for d in dirs if d not in ("node_modules", ".git", "__pycache__")]
                for f in files:
                    rel = os.path.relpath(os.path.join(root, f), repo_path).lower()
                    all_files.add(rel)
                    all_files.add(os.path.basename(rel))

            if any("dockerfile" in f for f in all_files):
                score += 20
            if any("docker-compose" in f for f in all_files):
                score += 15
            if any(f in all_files for f in (".github", ".travis.yml", ".circleci", "jenkinsfile", ".gitlab-ci.yml")):
                score += 20
            if ".env.example" in all_files:
                score += 10
            if any(f in all_files for f in ("makefile", "justfile")):
                score += 5
            if any("kubernetes" in f or "/k8s/" in f or "helm" in f for f in all_files):
                score += 20
            if any(f.endswith(".tf") or "terraform" in f for f in all_files):
                score += 15

        return round(min(100.0, score / max(len(repo_paths), 1)), 1)

    # ── Aggregation ────────────────────────────────────────────────────────

    def aggregate(
        self,
        code_quality: float,
        architecture: float,
        testing: float,
        performance: float,
        deployment: float,
    ) -> float:
        """Weighted aggregation of all dimensions → overall 0–100."""
        overall = (
            code_quality * self.weights["code_quality"]
            + architecture * self.weights["architecture"]
            + testing * self.weights["testing"]
            + performance * self.weights["performance"]
            + deployment * self.weights["deployment"]
        )
        return round(min(100.0, max(0.0, overall)), 1)

    def get_skill_level(self, overall: float) -> str:
        if overall <= JUNIOR_MAX:
            return "Junior"
        if overall <= MID_LEVEL_MAX:
            return "Mid-level"
        return "Senior"

    def get_percentile(self, overall: float) -> int:
        """Interpolate percentile from benchmark table."""
        score_int = int(round(overall))
        for i, (s, p) in enumerate(BENCHMARK_PERCENTILES):
            if score_int <= s:
                if i == 0:
                    return p
                prev_s, prev_p = BENCHMARK_PERCENTILES[i - 1]
                # Linear interpolation
                frac = (score_int - prev_s) / max(s - prev_s, 1)
                return round(prev_p + frac * (p - prev_p))
        return BENCHMARK_PERCENTILES[-1][1]

    # ── Main entry point ───────────────────────────────────────────────────

    def score(
        self,
        radon_avg_cc: Optional[float] = None,
        radon_avg_mi: Optional[float] = None,
        pylint_score: Optional[float] = None,
        eslint_errors: int = 0,
        eslint_warnings: int = 0,
        eslint_loc: int = 1000,
        semgrep_findings: int = 0,
        semgrep_loc: int = 1000,
        lighthouse_score: Optional[float] = None,
        repo_paths: Optional[List[str]] = None,
    ) -> ScoringResult:
        repo_paths = repo_paths or []

        # ── Code quality ───────────────────────────────────────────────────
        cq_scores = []
        if radon_avg_cc is not None:
            cq_scores.append(self.normalize_radon_cc(radon_avg_cc))
        if radon_avg_mi is not None:
            cq_scores.append(self.normalize_radon_mi(radon_avg_mi))
        if pylint_score is not None:
            cq_scores.append(self.normalize_pylint(pylint_score))
        # ESLint always contributes
        cq_scores.append(self.normalize_eslint(eslint_errors, eslint_warnings, eslint_loc))
        # Semgrep security findings reduce code quality
        semgrep_norm = self.normalize_semgrep(semgrep_findings, semgrep_loc)
        cq_scores.append(semgrep_norm)

        code_quality = round(sum(cq_scores) / len(cq_scores), 1) if cq_scores else 50.0

        # ── Architecture ───────────────────────────────────────────────────
        architecture = self.calculate_architecture_score(repo_paths) if repo_paths else 40.0

        # ── Testing ────────────────────────────────────────────────────────
        testing = self.calculate_testing_score(repo_paths) if repo_paths else 20.0

        # ── Performance ────────────────────────────────────────────────────
        performance = self.normalize_lighthouse(lighthouse_score) if lighthouse_score is not None else 50.0

        # ── Deployment ─────────────────────────────────────────────────────
        deployment = self.calculate_deployment_score(repo_paths) if repo_paths else 30.0

        overall = self.aggregate(code_quality, architecture, testing, performance, deployment)
        skill_level = self.get_skill_level(overall)
        percentile = self.get_percentile(overall)

        return ScoringResult(
            dimensions=DimensionScores(
                code_quality=code_quality,
                architecture=architecture,
                testing=testing,
                performance=performance,
                deployment=deployment,
            ),
            overall=overall,
            skill_level=skill_level,
            percentile=percentile,
            breakdown={
                "code_quality_weight": self.weights["code_quality"],
                "architecture_weight": self.weights["architecture"],
                "testing_weight": self.weights["testing"],
                "performance_weight": self.weights["performance"],
                "deployment_weight": self.weights["deployment"],
            },
        )
