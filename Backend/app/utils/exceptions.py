"""
app/utils/exceptions.py — Custom exception hierarchy.
"""
from __future__ import annotations


class CodeAuditError(Exception):
    """Base exception for all application errors."""


class AuditNotFoundError(CodeAuditError):
    def __init__(self, audit_id: str) -> None:
        super().__init__(f"Audit not found: {audit_id}")
        self.audit_id = audit_id


class AuditNotCompleteError(CodeAuditError):
    def __init__(self, audit_id: str, status: str) -> None:
        super().__init__(f"Audit {audit_id} is not completed (status={status})")
        self.audit_id = audit_id
        self.status = status


class PipelineError(CodeAuditError):
    """Raised when a pipeline step fails unrecoverably."""


class ExternalAPIError(CodeAuditError):
    """Raised when an external API (GitHub, Anthropic) returns an error."""

    def __init__(self, service: str, detail: str) -> None:
        super().__init__(f"{service} API error: {detail}")
        self.service = service
