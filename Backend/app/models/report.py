"""app/models/report.py — Report ORM model with skill level enum."""
from __future__ import annotations

import datetime
import enum
import uuid

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SkillLevel(str, enum.Enum):
    junior = "Junior"
    mid_level = "Mid-level"
    senior = "Senior"

    @classmethod
    def from_str(cls, s: str) -> "SkillLevel":
        """Case-insensitive lookup by value."""
        for member in cls:
            if member.value.lower() == s.lower():
                return member
        raise ValueError(f"Unknown SkillLevel: {s!r}")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    audit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("audits.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )

    # ── Skill classification ────────────────────────────────────────────────
    skill_level: Mapped[SkillLevel] = mapped_column(Enum(SkillLevel), nullable=False)

    # ── Dimension scores (0–100) ───────────────────────────────────────────
    code_quality_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    architecture_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    testing_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    performance_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    deployment_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    overall_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    percentile: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # ── LLM-generated structured data ──────────────────────────────────────
    strengths: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    critical_issues: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    recommendations: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    radar_data: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    llm_narrative: Mapped[str | None] = mapped_column(Text, nullable=True)
    roadmap: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    job_matches: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    resume_bullets: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ── Relationships ──────────────────────────────────────────────────────
    audit: Mapped["Audit"] = relationship("Audit", back_populates="report")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Report audit_id={self.audit_id} level={self.skill_level} overall={self.overall_score}>"
