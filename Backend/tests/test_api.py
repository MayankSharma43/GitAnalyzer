"""
tests/test_api.py — Integration tests for the REST API endpoints.
"""
import pytest
import uuid
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


@pytest.mark.anyio
async def test_create_audit_invalid_github_url():
    """Non-github URL should return 422."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/audit", json={
            "github_url": "https://example.com/user",
            "claimed_level": "Senior",
        })
    assert response.status_code == 422


@pytest.mark.anyio
async def test_get_nonexistent_audit():
    """Unknown audit_id returns 404."""
    fake_id = str(uuid.uuid4())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(f"/audit/{fake_id}")
    assert response.status_code == 404
    assert "error" in response.json().get("detail", response.json())


@pytest.mark.anyio
async def test_get_report_nonexistent_audit():
    """Unknown audit report returns 404."""
    fake_id = str(uuid.uuid4())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(f"/audit/{fake_id}/report")
    assert response.status_code == 404
