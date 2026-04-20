"""
app/workers/celery_app.py — Celery application factory.
"""
from __future__ import annotations

from celery import Celery
from app.config import settings

celery_app = Celery(
    "codeaudit",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.workers.tasks.github_tasks",
        "app.workers.tasks.clone_tasks",
        "app.workers.tasks.analysis_tasks",
        "app.workers.tasks.web_tasks",
        "app.workers.tasks.scoring_tasks",
        "app.workers.tasks.report_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    result_expires=86400,           # 24h
    task_track_started=True,
    task_acks_late=True,            # Re-queue on worker crash
    worker_prefetch_multiplier=1,   # One task at a time per worker
    task_soft_time_limit=600,       # 10 min soft limit
    task_time_limit=720,            # 12 min hard limit
    broker_connection_retry_on_startup=True,
)
