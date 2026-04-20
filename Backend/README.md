# Developer Career Intelligence System

**Production-grade backend** for auditing a developer's real-world skills by analyzing their GitHub repositories and live applications — then generating a brutally honest, AI-written skill audit report.

---

## Stack

| Layer | Tech |
|-------|------|
| API | FastAPI 0.111 + Uvicorn |
| Tasks | Celery 5 + Redis |
| Database | PostgreSQL 15 via SQLAlchemy 2.0 async |
| Migrations | Alembic |
| Analysis | Radon · Pylint · ESLint · Semgrep |
| Web audit | Playwright + Lighthouse CLI |
| AI report | Anthropic `claude-sonnet-4-5` |
| Containerization | Docker + docker-compose |

---

## Quick Start (Local)

### Prerequisites

You need **PostgreSQL**, **Redis**, **Python 3.11+**, and **Node.js 18+**.

#### Option A — Docker (recommended, one command)
```bash
docker-compose up
```
Everything starts automatically. API at `http://localhost:8000`.

#### Option B — Local (no Docker)

**1. Install dependencies**
```bash
# Windows — PostgreSQL
winget install PostgreSQL.PostgreSQL.16

# Windows — Redis (Memurai is a Windows-native Redis)
winget install Memurai.Memurai
# OR use WSL: wsl --install then: sudo apt install redis-server && redis-server

# Python packages
pip install -r requirements.txt

# Node + Lighthouse
winget install OpenJS.NodeJS.LTS
npm install -g lighthouse
```

**2. Set up the database**
```powershell
# Create DB and all tables in one command
python setup_db.py
```

**3. Verify all services are up**
```powershell
python verify_setup.py
```

**4. Start three terminals**

```powershell
# Terminal 1 — FastAPI server
cd Backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Celery worker
cd Backend
celery -A app.workers.celery_app:celery_app worker --loglevel=info --pool=solo

# Terminal 3 — Frontend (React)
cd Frontend
npm install
npm run dev
```

Open `http://localhost:5173` — enter your GitHub URL — watch the audit run live.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in (already done with your keys):

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub PAT for API calls |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@host/db` |
| `REDIS_URL` | `redis://localhost:6379/0` |

> ⚠️ `.env` is gitignored. Never commit it.

---

## API Reference

### `POST /audit`
Start a new audit pipeline.

```json
{
  "github_url": "https://github.com/your-handle",
  "additional_urls": ["https://github.com/your-handle/specific-repo"],
  "live_app_url": "https://your-deployed-app.com",
  "claimed_level": "Senior",
  "location": "Berlin, Germany",
  "remote": false
}
```

**Response `202`:**
```json
{
  "audit_id": "3f7a2e1b-c8a4-4d2f-9b1e-7a3f2e1bc8a4",
  "status": "pending",
  "message": "Audit queued. Connect to /audit/{id}/progress for live updates."
}
```

---

### `GET /audit/{audit_id}`
Poll status + scores.

**Response (completed):**
```json
{
  "audit_id": "3f7a2e1b-...",
  "status": "completed",
  "github_username": "your-handle",
  "created_at": "2026-04-20T09:00:00Z",
  "completed_at": "2026-04-20T09:04:32Z",
  "scores": {
    "code_quality": 64,
    "architecture": 60,
    "testing": 32,
    "performance": 55,
    "deployment": 70,
    "overall": 57
  },
  "skill_level": "Mid-level",
  "percentile": 41
}
```

---

### `GET /audit/{audit_id}/report`
Full structured report.

```json
{
  "audit_id": "...",
  "skill_level": "Mid-level",
  "overall_score": 57,
  "percentile": 41,
  "scores": { "code_quality": 64, "architecture": 60, "testing": 32, "performance": 55, "deployment": 70, "overall": 57 },
  "strengths": ["Strong TypeScript typing in design-system", "..."],
  "critical_issues": [
    {
      "severity": "CRITICAL",
      "file": "payments-api/src/auth/jwt.ts",
      "line": 34,
      "title": "JWT refresh token never validated on rotation",
      "description": "refreshToken() decodes without verify(), enabling replay attacks.",
      "fix": "Use jwt.verify(token, SECRET) and catch JsonWebTokenError.",
      "owasp": "A02:2021 — Cryptographic Failures"
    }
  ],
  "recommendations": [
    { "rank": 1, "title": "Validate JWT refresh signature", "effort": "1h", "impact": "CRITICAL", "why": "Replay attack vector." }
  ],
  "radar_data": [
    { "axis": "Code Quality", "claimed": 90, "actual": 64 }
  ],
  "career_narrative": "You're a solid mid-level engineer with real production instincts, but the security gaps in your auth implementation would be auto-rejection flags at any serious fintech or security-conscious team...",
  "repos_analysed": 5,
  "languages": [{ "name": "TypeScript", "value": 60, "color": "#a78bfa" }],
  "created_at": "2026-04-20T09:04:32Z"
}
```

---

### `WS /audit/{audit_id}/progress`
WebSocket stream. Emits `ProgressEvent` JSON frames:

```json
{
  "audit_id": "...",
  "step": 3,
  "total_steps": 6,
  "step_name": "Running static analysis",
  "message": "Running Radon, Pylint, ESLint, and Semgrep...",
  "section": "CODE",
  "percent": 50.0,
  "status": "running",
  "data": {}
}
```

Closes with `"status": "completed"` or `"status": "failed"`.

---

### `GET /health`
```json
{
  "status": "ok",
  "version": "1.0.0",
  "db": "ok",
  "redis": "ok",
  "environment": "development"
}
```

---

## Pipeline Steps

| Step | Task | Description |
|------|------|-------------|
| 1 | `fetch_github_data` | GitHub REST v3 + GraphQL v4 |
| 2 | `clone_repositories` | git clone top 5 repos (depth=1) |
| 3 | `run_static_analysis` | Radon · Pylint · ESLint · Semgrep |
| 4 | `run_web_audit` | Lighthouse + Playwright (if live URL given) |
| 5 | `score_developer` | Weighted scoring → skill level + percentile |
| 6 | `generate_report` | Anthropic Claude → JSON narrative |

---

## Scoring Algorithm

```
code_quality  = avg(Radon CC, Radon MI, Pylint, ESLint, Semgrep)  × 30%
architecture  = file-structure heuristics                           × 20%
testing       = test-file ratio + coverage config                   × 25%
performance   = Lighthouse composite                                 × 15%
deployment    = CI/CD + Dockerfile + IaC detection                  × 10%
```

**Skill levels:** Junior ≤ 40 · Mid-level 41–69 · Senior ≥ 70

---

## Running Tests

```bash
pytest tests/ -v --tb=short
```

---

## Project Structure

```
Backend/
├── app/
│   ├── main.py              # FastAPI entrypoint
│   ├── config.py            # pydantic-settings
│   ├── database.py          # async SQLAlchemy engine
│   ├── models/              # ORM models (5 tables)
│   ├── schemas/             # Pydantic schemas
│   ├── api/routes/          # REST + WebSocket endpoints
│   ├── services/            # GitHub, Scoring, Report AI
│   ├── workers/             # Celery app + 6 pipeline tasks
│   ├── analyzers/           # Radon, Pylint, ESLint, Semgrep, Lighthouse
│   └── utils/               # Redis helpers, exceptions
├── alembic/                 # DB migrations
├── tests/                   # pytest test suite
├── setup_db.py              # One-shot DB setup
├── verify_setup.py          # Pre-flight health check
├── docker-compose.yml       # Full stack docker-compose
└── Dockerfile               # Python + Node + tools image
```
