"""
app/services/github_service.py
──────────────────────────────
GitHub REST v3 + GraphQL v4 client.
All calls use the GITHUB_TOKEN bearer auth.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from app.config import settings

logger = logging.getLogger(__name__)

REST_BASE = "https://api.github.com"
GRAPHQL_URL = "https://api.github.com/graphql"


def _headers() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.github_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(httpx.HTTPError),
)
async def _get(client: httpx.AsyncClient, url: str, **params: Any) -> Any:
    resp = await client.get(url, headers=_headers(), params=params, timeout=30.0)
    resp.raise_for_status()
    return resp.json()


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(httpx.HTTPError),
)
async def _graphql(client: httpx.AsyncClient, query: str, variables: Dict[str, Any]) -> Any:
    resp = await client.post(
        GRAPHQL_URL,
        headers=_headers(),
        json={"query": query, "variables": variables},
        timeout=30.0,
    )
    resp.raise_for_status()
    result = resp.json()
    if "errors" in result:
        logger.warning("GraphQL errors: %s", result["errors"])
    return result.get("data", {})


# ── Public API ─────────────────────────────────────────────────────────────────

async def fetch_profile(username: str) -> Dict[str, Any]:
    """Fetch public GitHub user profile via REST v3."""
    async with httpx.AsyncClient() as client:
        return await _get(client, f"{REST_BASE}/users/{username}")


async def fetch_repos(username: str, max_pages: int = 5) -> List[Dict[str, Any]]:
    """Fetch all public repos, paginated (up to max_pages × 100)."""
    all_repos: List[Dict[str, Any]] = []
    async with httpx.AsyncClient() as client:
        for page in range(1, max_pages + 1):
            page_data = await _get(
                client,
                f"{REST_BASE}/users/{username}/repos",
                per_page=100,
                page=page,
                sort="updated",
            )
            if not page_data:
                break
            all_repos.extend(page_data)
            if len(page_data) < 100:
                break  # last page
    return all_repos


async def fetch_contribution_graph(username: str) -> Dict[str, Any]:
    """Fetch contribution calendar via GraphQL v4."""
    query = """
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
    """
    async with httpx.AsyncClient() as client:
        data = await _graphql(client, query, {"login": username})
    return data.get("user", {}).get("contributionsCollection", {})


async def fetch_pinned_repos(username: str) -> List[Dict[str, Any]]:
    """Fetch pinned repositories via GraphQL v4."""
    query = """
    query($login: String!) {
      user(login: $login) {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
              url
              primaryLanguage { name }
              stargazerCount
              forkCount
              description
            }
          }
        }
      }
    }
    """
    async with httpx.AsyncClient() as client:
        data = await _graphql(client, query, {"login": username})
    return data.get("user", {}).get("pinnedItems", {}).get("nodes", [])


async def fetch_pr_activity(username: str) -> Dict[str, Any]:
    """Fetch PR stats (opened, merged, reviewed) via GraphQL v4."""
    query = """
    query($login: String!) {
      user(login: $login) {
        pullRequests(first: 100, states: [MERGED, OPEN]) {
          totalCount
          nodes {
            state
            additions
            deletions
            createdAt
            repository { nameWithOwner }
          }
        }
      }
    }
    """
    async with httpx.AsyncClient() as client:
        data = await _graphql(client, query, {"login": username})
    return data.get("user", {}).get("pullRequests", {})


async def fetch_all_github_data(username: str) -> Dict[str, Any]:
    """
    Orchestrate all GitHub API calls and return a single aggregated dict.
    This is what gets stored in audit.github_data (JSONB).
    """
    logger.info("Fetching GitHub data for user: %s", username)
    profile = await fetch_profile(username)
    repos = await fetch_repos(username)
    contributions = await fetch_contribution_graph(username)
    pinned = await fetch_pinned_repos(username)
    prs = await fetch_pr_activity(username)

    # ── Language distribution ──────────────────────────────────────────────
    lang_counts: Dict[str, int] = {}
    for repo in repos:
        lang = repo.get("language")
        if lang:
            lang_counts[lang] = lang_counts.get(lang, 0) + 1

    # ── Top repos by stars + recency ───────────────────────────────────────
    scored_repos = []
    for r in repos:
        recency_bonus = 1 if r.get("pushed_at", "") > "2024-01-01" else 0
        score = r.get("stargazers_count", 0) * 2 + r.get("forks_count", 0) + recency_bonus * 5
        scored_repos.append({**r, "_priority_score": score})
    top_repos = sorted(scored_repos, key=lambda x: x["_priority_score"], reverse=True)[:5]

    return {
        "profile": profile,
        "total_repos": len(repos),
        "repos": repos,
        "top_repos": top_repos,
        "language_distribution": lang_counts,
        "contributions": contributions,
        "pinned_repos": pinned,
        "pull_requests": prs,
    }
