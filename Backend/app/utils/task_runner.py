"""
app/utils/task_runner.py
────────────────────────
run_async() — Safe asyncio runner for Celery tasks on Windows.

Problem:
  Python 3.8+ on Windows uses ProactorEventLoop by default.
  asyncpg is NOT compatible with ProactorEventLoop. It requires
  SelectorEventLoop. When Celery uses asyncio.run() in a task,
  the ProactorEventLoop is created and asyncpg fails with:
    AttributeError: 'NoneType' object has no attribute 'send'

Solution:
  Always create a fresh SelectorEventLoop for each Celery task
  and explicitly close it afterwards. This is safe because each
  task_session() creates its own engine/connection, then disposes it.
"""
from __future__ import annotations

import asyncio
import sys
from typing import Any, Coroutine, TypeVar

T = TypeVar("T")


def run_async(coro: Coroutine[Any, Any, T]) -> T:
    """
    Run an async coroutine in a fresh SelectorEventLoop.
    Safe for use inside Celery tasks on all platforms.
    """
    if sys.platform == "win32":
        # Force SelectorEventLoop — required for asyncpg on Windows
        loop = asyncio.SelectorEventLoop()
    else:
        loop = asyncio.new_event_loop()

    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        try:
            # Cancel any pending tasks
            pending = asyncio.all_tasks(loop)
            for task in pending:
                task.cancel()
            if pending:
                loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
        finally:
            loop.close()
            asyncio.set_event_loop(None)
