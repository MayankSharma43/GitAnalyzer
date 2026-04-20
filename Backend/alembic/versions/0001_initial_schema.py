"""Generic single-database configuration with an async dbapi."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("github_username", sa.String(255), nullable=False, unique=True),
        sa.Column("email", sa.String(320), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_github_username", "users", ["github_username"])

    # ── audits ─────────────────────────────────────────────────────────────
    op.create_table(
        "audits",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", sa.Enum("pending", "running", "completed", "failed", name="auditstatus"), nullable=False, server_default="pending"),
        sa.Column("input_github_url", sa.String(512), nullable=False),
        sa.Column("input_repo_urls", postgresql.JSONB(), nullable=True),
        sa.Column("input_live_url", sa.String(512), nullable=True),
        sa.Column("claimed_level", sa.String(50), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("remote", sa.Boolean(), server_default="false"),
        sa.Column("github_data", postgresql.JSONB(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_audits_user_id", "audits", ["user_id"])
    op.create_index("ix_audits_status", "audits", ["status"])

    # ── repositories ───────────────────────────────────────────────────────
    op.create_table(
        "repositories",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("audit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("audits.id", ondelete="CASCADE"), nullable=False),
        sa.Column("repo_url", sa.String(512), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("language", sa.String(100), nullable=True),
        sa.Column("stars", sa.Integer(), server_default="0"),
        sa.Column("forks", sa.Integer(), server_default="0"),
        sa.Column("clone_path", sa.String(1024), nullable=True),
    )
    op.create_index("ix_repositories_audit_id", "repositories", ["audit_id"])

    # ── analysis_results ───────────────────────────────────────────────────
    op.create_table(
        "analysis_results",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tool_name", sa.String(100), nullable=False),
        sa.Column("raw_output", postgresql.JSONB(), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_analysis_results_repository_id", "analysis_results", ["repository_id"])

    # ── reports ────────────────────────────────────────────────────────────
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("audit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("audits.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("skill_level", sa.Enum("Junior", "Mid-level", "Senior", name="skilllevel"), nullable=False),
        sa.Column("code_quality_score", sa.Float(), server_default="0"),
        sa.Column("architecture_score", sa.Float(), server_default="0"),
        sa.Column("testing_score", sa.Float(), server_default="0"),
        sa.Column("performance_score", sa.Float(), server_default="0"),
        sa.Column("deployment_score", sa.Float(), server_default="0"),
        sa.Column("overall_score", sa.Float(), server_default="0"),
        sa.Column("percentile", sa.Integer(), server_default="0"),
        sa.Column("strengths", postgresql.JSONB(), nullable=True),
        sa.Column("critical_issues", postgresql.JSONB(), nullable=True),
        sa.Column("recommendations", postgresql.JSONB(), nullable=True),
        sa.Column("radar_data", postgresql.JSONB(), nullable=True),
        sa.Column("llm_narrative", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_reports_audit_id", "reports", ["audit_id"])


def downgrade() -> None:
    op.drop_table("reports")
    op.drop_table("analysis_results")
    op.drop_table("repositories")
    op.drop_table("audits")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS auditstatus")
    op.execute("DROP TYPE IF EXISTS skilllevel")
