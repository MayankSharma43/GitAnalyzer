# Truth Pulse — Developer Career Intelligence System

**Truth Pulse** is a production-grade developer auditing application. It analyzes a developer's real-world skills by scanning their GitHub repositories, running static code analysis, and utilizing AI to generate a brutally honest, data-driven skill audit report.

This repository is split into two independent but interconnected components:

- **Frontend**: A modern React application built using Vite, TanStack Router, Tailwind CSS, Radix UI, Framer Motion, and GSAP. 
- **Backend**: A robust API and worker architecture built with FastAPI, PostgreSQL, Redis, Celery, and the Anthropic Claude API for report generation.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS (v4) + Radix UI Primitives + Shadcn UI concepts
- **Animation**: GSAP + Framer Motion
- **Data Fetching**: TanStack React Query

### Backend
- **API**: FastAPI (Python 3.11+)
- **Task Queue**: Celery + Redis
- **Database**: PostgreSQL 15 (via SQLAlchemy 2.0 Async + AsyncPG)
- **Migrations**: Alembic
- **Static Analysis Tools**: Radon, Pylint, ESLint, Semgrep
- **Web Audit Tools**: Playwright + Lighthouse CLI
- **Language Model**: Anthropic Claude API (`claude-3-5-sonnet-20241022`)

---

## 🚀 Quick Start (Local Setup)

To run Truth Pulse locally, you will need to host both the Backend services and the Frontend React app simultaneously.

### Prerequisites
- **PostgreSQL**: Running locally or via Docker.
- **Redis**: Running locally or via Docker/WSL.
- **Python**: 3.11+
- **Node.js**: 18+

### Step 1: Clone and Set Up the Database

First, create the required PostgreSQL database (`codeaudit`) and set up the tables:
```bash
cd Backend
python setup_db.py
python verify_setup.py
```

### Step 2: Configure Environment Variables

**Backend Variables**
Copy `Backend/.env.example` to `Backend/.env` and update the required credentials:
```env
GITHUB_TOKEN=your_github_personal_access_token
ANTHROPIC_API_KEY=your_anthropic_secret_key
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/codeaudit
REDIS_URL=redis://localhost:6379/0
APP_ENV=development
```

### Step 3: Run the Development Servers

You will need three separate terminal windows to run the stack.

**Terminal 1 — FastAPI Server**
Starts the core backend API server:
```bash
cd Backend
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Celery Worker**
Starts the async task processor (handles repo cloning, static analysis, AI integration):
```bash
cd Backend
# Note: On Windows, use --pool=solo. On Linux/Mac, you can omit the pool argument.
celery -A app.workers.celery_app:celery_app worker --loglevel=info --pool=solo
```

**Terminal 3 — Frontend React App**
Starts the client interface:
```bash
cd Frontend
npm install
npm run dev
# Note: If npm running scripts is restricted on Windows, try `npm.cmd run dev` or run as Administrator.
```

The API will run on `http://localhost:8000` and the frontend will be accessible at `http://localhost:5173`. 

---

## 🐋 Docker Alternative (Backend Only)

If you prefer to containerize the backend layer, a `docker-compose.yml` is provided in the `Backend` fold to spin up the API, Celery worker, PostgreSQL, and Redis automatically.

```bash
cd Backend
docker-compose up -d
```
You will still need to run the `Frontend` interface locally via Node.js as illustrated in Step 3.

---

## 🔗 How It Works

1. **User Input:** Enter your GitHub profile URL and claimed skill level into the frontend landing page.
2. **Analysis Initiation:** The FastAPI server queues an audit task and opens a WebSocket stream with the frontend to relay live progress updates. 
3. **Repository Harvesting:** Background Celery workers fetch profile metrics and clone up to 5 of the top public repositories.
4. **Tool Parsing:** Background jobs execute standard linters, code quality heuristic parsers (Radon, Semgrep), and fetch dependencies.
5. **AI Synthesis:** Code metrics and code snippets are passed as contextual context to Claude 3.5 Sonnet to map them to your real-world capability. 
6. **Result Resolution:** The completed JSON payload with recommendations and code criticism is beamed to the frontend where the React client visualizes it using responsive Radix layouts and charting libraries.

---

## 📁 Repository Structure

```text
code-truth-pulse-main/
├── Backend/                    # Python FastAPI application
│   ├── app/                    # API endpoints, DB Models, Services, Celery config
│   ├── tests/                  # Pytest automation
│   ├── alembic/                # DB Migrations
│   ├── docker-compose.yml      # DB + Redis container definitions
│   └── requirements.txt        # Python dependency manifest
│
├── Frontend/                   # React, Vite, Tailwind client
│   ├── src/                    # UI Components, Routes, API Clients
│   ├── package.json            # Node dependency manifest
│   └── vite.config.ts          # Vite build config
│
└── README.md                   # This file
```
