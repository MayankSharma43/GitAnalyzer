"""
tests/test_scoring.py — Unit tests for the ScoringEngine.
"""
import pytest
from app.services.scoring import ScoringEngine, JUNIOR_MAX, MID_LEVEL_MAX


@pytest.fixture
def engine():
    return ScoringEngine()


class TestNormalizers:
    def test_radon_cc_perfect(self, engine):
        assert engine.normalize_radon_cc(1.0) == 100.0

    def test_radon_cc_high_complexity(self, engine):
        score = engine.normalize_radon_cc(20.0)
        assert 0.0 <= score <= 40.0

    def test_radon_mi_passthrough(self, engine):
        assert engine.normalize_radon_mi(75.0) == 75.0
        assert engine.normalize_radon_mi(0.0) == 0.0
        assert engine.normalize_radon_mi(110.0) == 100.0

    def test_pylint_perfect(self, engine):
        assert engine.normalize_pylint(10.0) == 100.0

    def test_pylint_zero(self, engine):
        assert engine.normalize_pylint(0.0) == 0.0

    def test_pylint_low_penalty(self, engine):
        # Below 5.0 gets additional 30% penalty
        score_4 = engine.normalize_pylint(4.0)
        score_6 = engine.normalize_pylint(6.0)
        # score_4 should be disproportionately lower
        assert score_4 < score_6 * 0.9

    def test_eslint_no_issues(self, engine):
        assert engine.normalize_eslint(0, 0, 1000) == 100.0

    def test_eslint_many_errors(self, engine):
        score = engine.normalize_eslint(100, 200, 1000)
        assert score == 0.0

    def test_semgrep_clean(self, engine):
        assert engine.normalize_semgrep(0, 1000) == 100.0

    def test_semgrep_many_findings(self, engine):
        score = engine.normalize_semgrep(50, 1000)
        assert score <= 50.0


class TestSkillLevels:
    def test_junior_threshold(self, engine):
        assert engine.get_skill_level(0) == "Junior"
        assert engine.get_skill_level(JUNIOR_MAX) == "Junior"

    def test_mid_level_threshold(self, engine):
        assert engine.get_skill_level(JUNIOR_MAX + 1) == "Mid-level"
        assert engine.get_skill_level(MID_LEVEL_MAX) == "Mid-level"

    def test_senior_threshold(self, engine):
        assert engine.get_skill_level(MID_LEVEL_MAX + 1) == "Senior"
        assert engine.get_skill_level(100) == "Senior"


class TestPercentile:
    def test_zero_score(self, engine):
        assert engine.get_percentile(0) == 0

    def test_max_score(self, engine):
        assert engine.get_percentile(100) == 99

    def test_median_score(self, engine):
        # Score 50 should be roughly 50th percentile
        p = engine.get_percentile(50)
        assert 45 <= p <= 60


class TestAggregation:
    def test_weights_sum_to_one(self, engine):
        total = sum(engine.weights.values())
        assert abs(total - 1.0) < 0.001

    def test_all_perfect(self, engine):
        result = engine.aggregate(100, 100, 100, 100, 100)
        assert result == 100.0

    def test_all_zero(self, engine):
        result = engine.aggregate(0, 0, 0, 0, 0)
        assert result == 0.0

    def test_mixed_scores(self, engine):
        result = engine.aggregate(70, 60, 40, 55, 80)
        assert 0 < result < 100


class TestFullScore:
    def test_full_pipeline(self, engine):
        result = engine.score(
            radon_avg_cc=5.0,
            radon_avg_mi=65.0,
            pylint_score=7.0,
            eslint_errors=5,
            eslint_warnings=20,
            eslint_loc=2000,
            semgrep_findings=3,
            semgrep_loc=2000,
            lighthouse_score=75.0,
        )
        assert 0 < result.overall < 100
        assert result.skill_level in ("Junior", "Mid-level", "Senior")
        assert 0 <= result.percentile <= 100

    def test_no_inputs_returns_defaults(self, engine):
        result = engine.score()
        assert result.overall > 0
        assert result.skill_level in ("Junior", "Mid-level", "Senior")
