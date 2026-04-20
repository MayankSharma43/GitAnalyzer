FROM python:3.11-slim

# ── System packages ─────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    build-essential \
    libpq-dev \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# ── Node.js 18 (for Lighthouse + ESLint) ────────────────────────────────────
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g lighthouse \
    && rm -rf /var/lib/apt/lists/*

# ── Python dependencies ──────────────────────────────────────────────────────
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Playwright + Chromium ────────────────────────────────────────────────────
RUN playwright install chromium --with-deps

# ── Copy application code ────────────────────────────────────────────────────
COPY . .

# ── Default command: FastAPI ─────────────────────────────────────────────────
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
