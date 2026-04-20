"""app/models/audit.py — Audit ORM model with status enum."""
from __future__ import annotations

import datetime
import enum
import uuid

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AuditStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class Audit(Base):
    __tablename__ = "audits"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    status: Mapped[AuditStatus] = mapped_column(
        Enum(AuditStatus), nullable=False, default=AuditStatus.pending, index=True
    )

    # Input fields
    input_github_url: Mapped[str] = mapped_column(String(512), nullable=False)
    input_repo_urls: Mapped[dict | list | None] = mapped_column(JSONB, nullable=True)
    input_live_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    claimed_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    remote: Mapped[bool | None] = mapped_column(default=False)

    # GitHub profile cache
    github_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Error tracking
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ──────────────────────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="audits")  # noqa: F821
    repositories: Mapped[list["Repository"]] = relationship(  # noqa: F821
        "Repository", back_populates="audit", cascade="all, delete-orphan", lazy="selectin"
    )
    report: Mapped["Report | None"] = relationship(  # noqa: F821
        "Report", back_populates="audit", uselist=False, lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Audit id={self.id} status={self.status} github={self.input_github_url!r}>"
