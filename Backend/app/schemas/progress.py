"""app/schemas/progress.py — WebSocket progress event schema."""
from __future__ import annotations

from typing import Any, Dict, Optional
from pydantic import BaseModel


class ProgressEvent(BaseModel):
    """
    Emitted over WebSocket at /audit/{audit_id}/progress.
    Frontend polls this to update the Auditing.tsx terminal view.
    """

    audit_id: str
    step: int            # 1–6
    total_steps: int = 6
    step_name: str       # e.g. "Fetching GitHub data"
    message: str         # e.g. "Found 47 repositories"
    section: str         # CODE | SECURITY | UIUX | JOBS | ROADMAP | RESUME
    percent: float       # 0.0 – 100.0
    status: str          # running | completed | failed
    data: Optional[Dict[str, Any]] = None  # optional partial scores
