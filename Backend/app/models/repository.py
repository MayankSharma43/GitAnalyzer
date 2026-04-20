"""app/models/repository.py — Repository ORM model."""
from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    audit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("audits.id", ondelete="CASCADE"), nullable=False, index=True
    )
    repo_url: Mapped[str] = mapped_column(String(512), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    language: Mapped[str | None] = mapped_column(String(100), nullable=True)
    stars: Mapped[int] = mapped_column(Integer, default=0)
    forks: Mapped[int] = mapped_column(Integer, default=0)
    clone_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────
    audit: Mapped["Audit"] = relationship("Audit", back_populates="repositories")  # noqa: F821
    analysis_results: Mapped[list["AnalysisResult"]] = relationship(  # noqa: F821
        "AnalysisResult", back_populates="repository", cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Repository name={self.name!r} lang={self.language!r}>"
