# Dockerize FastAPI Backend Roadmap https://www.youtube.com/watch?v=ED6PRjmXgBA

This document outlines the step-by-step implementation plan for dockerizing the Smart Invoice FastAPI backend and ensuring all configurations are driven by environment variables. No hosting or deployment is configured at this stage.

---

## 1. Backend Configuration Updates

### Objective
Ensure that **all** dynamic parameters are manageable via environment variables without requiring code changes for different environments (local, staging, production).

### Tasks
- **Modify `main.py`**:
  - Read `CORS_ORIGINS` from the environment (e.g., `os.getenv("CORS_ORIGINS", "*")`).
  - Parse the string into a list of origins by splitting on commas.
  - Default to `["*"]` if the variable is not set.
  - Add `PORT` env var (default `8000`) for the uvicorn startup port.
  - Add `LOG_LEVEL` env var (default `info`) for uvicorn log level.

- **Environment variables checklist** (all must be supplied at runtime, never baked into the image):

  | Variable | Required | Default | Description |
  |----------|----------|---------|-------------|
  | `SUPABASE_URL` | Yes | — | Supabase project URL |
  | `SUPABASE_KEY` | Yes | — | Supabase publishable key |
  | `SUPABASE_JWT_SECRET` | Yes | — | JWT secret for auth verification |
  | `OPENAI_API_KEY` | Conditional | — | Required when `LLM_PROVIDER=openai` |
  | `ANTHROPIC_API_KEY` | Conditional | — | Required when `LLM_PROVIDER=anthropic` |
  | `DEEPSEEK_API_KEY` | Conditional | — | Required when `LLM_PROVIDER=deepseek` |
  | `LLM_PROVIDER` | No | `openai` | LLM backend (`openai`, `anthropic`, `deepseek`) |
  | `LLM_MODEL` | No | Provider default | Override default model per provider |
  | `CORS_ORIGINS` | No | `*` | Comma-separated allowed origins |
  | `PORT` | No | `8000` | Server listen port |
  | `LOG_LEVEL` | No | `info` | Uvicorn log level |
  | `WEB_CONCURRENCY` | No | `1` | Number of uvicorn workers |

---

## 2. Security Hardening

### Objective
Ensure no secrets are leaked in the Docker image or version control.

### Tasks
- **Remove `.env` from git tracking** (it was committed before `.gitignore` was added):
  ```bash
  git rm --cached smart-invoice-backend/.env
  ```
- **Rotate all exposed keys** — the following secrets are compromised and must be regenerated:
  - `OPENAI_API_KEY`
  - `SUPABASE_KEY`
  - `SUPABASE_JWT_SECRET`
- **Create `.env.example`** with placeholder values (safe to commit).
- **Never use `COPY .env`** in the Dockerfile or `ARG` for secrets (build args are visible in image history).
- **Use `--env-file` at runtime** or Docker secrets / orchestrator secret injection.

---

## 3. Docker Setup

### Objective
Create an isolated, reproducible, production-ready container environment for the FastAPI backend.

### 3a. Create `Dockerfile` (multi-stage build)

```dockerfile
# ──────────────────────────────────────
# Stage 1: Builder — install Python deps
# ──────────────────────────────────────
FROM python:3.13-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ──────────────────────────────────────
# Stage 2: Runtime — minimal production image
# ──────────────────────────────────────
FROM python:3.13-slim

# WeasyPrint system dependencies (required for PDF generation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN addgroup --system app && adduser --system --ingroup app app

WORKDIR /app

# Copy installed Python packages from builder stage
COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application source code
COPY . .

# Switch to non-root user
USER app

EXPOSE 8000

# Health check against the existing GET / endpoint
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/')"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
```

**Key decisions:**
- **`python:3.13-slim`** — matches the project's current Python version (verified via `__pycache__/*.cpython-313.pyc`).
- **Multi-stage build** — the builder stage can include build tools (gcc, etc.) if needed for C extensions; the runtime stage stays slim.
- **WeasyPrint system deps** — without `libcairo2`, `libpango`, etc., PDF generation will crash at runtime. This is the single biggest gotcha.
- **Non-root user** — the `app` user prevents container-escape privilege escalation.
- **`--proxy-headers`** — required when running behind a reverse proxy (Nginx, Cloudflare, load balancer) so `X-Forwarded-For` headers are trusted.
- **HEALTHCHECK** — enables Docker and orchestrators to detect unhealthy containers and restart them.

### 3b. Create `.dockerignore`

```
# Virtual environment & caches
venv/
__pycache__/
*.pyc
*.pyo
*.pyd
.pytest_cache/
.mypy_cache/
.ruff_cache/

# Secrets — never bake into image
.env
.env.*
!.env.example

# Version control
.git/
.gitignore

# Test & dev artifacts
tests/
scripts/
docs/
pytest.ini
test_out.txt

# Database & schema files (not needed at runtime)
*.db
*.sql

# Documentation
*.md
```

**Rationale:** `tests/`, `scripts/`, `docs/`, and `*.sql` are excluded because they add image bloat with zero runtime value. Secrets are excluded to prevent accidental leakage into image layers.

### 3c. Pin dependency versions

Current `requirements.txt` has unpinned packages. For reproducible Docker builds:
```bash
pip freeze > requirements.lock
```
Use `requirements.lock` in the Dockerfile for production, keep `requirements.txt` for development flexibility.

---

## 4. Docker Compose (Local Development)

### Objective
Provide a one-command local setup for the containerized backend.

### `docker-compose.yml` (project root)

```yaml
services:
  api:
    build:
      context: ./smart-invoice-backend
      dockerfile: Dockerfile
    ports:
      - "${PORT:-8000}:8000"
    env_file:
      - ./smart-invoice-backend/.env
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/')"]
      interval: 30s
      timeout: 5s
      retries: 3
    restart: unless-stopped
```

---

## 5. Local Verification

### Objective
Confirm the Docker container builds, runs, and serves all endpoints correctly.

### Tasks

#### Build the image
```bash
cd smart-invoice-backend
docker build -t smart-invoice-backend:local .
```

#### Run the container
```bash
docker run -d -p 8000:8000 --env-file .env --name smart-invoice-api smart-invoice-backend:local
```

#### Verify endpoints
| Check | Command / URL | Expected |
|-------|---------------|----------|
| Health | `curl http://localhost:8000/` | `{"status": "ok", ...}` |
| API docs | `http://localhost:8000/docs` | Swagger UI loads |
| PDF generation | `GET /invoices/{id}/pdf` | PDF downloads (WeasyPrint works) |
| Non-root user | `docker exec smart-invoice-api whoami` | `app` |
| Health check | `docker inspect smart-invoice-api` | `"Status": "healthy"` |

> **PDF generation is the most likely failure point** — if WeasyPrint system deps are missing or incorrect, this endpoint will return a 500 error. Always test this explicitly.

#### Or use Docker Compose
```bash
docker compose up --build
```

---

## 6. Future Phases
- Set up automated CI/CD pipelines to build and push the Docker image to a registry.
- Deploy the Docker image to a hosting provider (AWS, GCP, Render, Fly.io, etc.).
- Add production logging (structured JSON output for log aggregation).
- Implement graceful shutdown handling (`SIGTERM` from `docker stop`).
- Consider pinning a `requirements.lock` for fully reproducible builds.
