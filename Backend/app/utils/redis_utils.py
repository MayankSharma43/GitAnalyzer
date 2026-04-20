"""
app/utils/redis_utils.py — Redis pub/sub helpers for WebSocket progress events.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict

import redis

from app.config import settings

logger = logging.getLogger(__name__)


def get_redis() -> redis.Redis:
    return redis.from_url(settings.redis_url, decode_responses=True)


def publish_event(channel: str, event: Dict[str, Any]) -> None:
    """Publish a JSON event to a Redis pub/sub channel."""
    try:
        r = get_redis()
        r.publish(channel, json.dumps(event))
    except Exception as exc:
        logger.warning("Redis publish failed on %s: %s", channel, exc)


def progress_channel(audit_id: str) -> str:
    return f"audit:{audit_id}:progress"
