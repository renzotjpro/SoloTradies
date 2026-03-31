# Dockerize FastAPI Backend Roadmap

This document outlines the step-by-step implementation plan for dockerizing the Smart Invoice FastAPI backend and ensuring all configurations are driven by environment variables. No hosting or deployment is configured at this stage.

## 1. Backend Configuration Updates

### Objective
Ensure that all dynamic parameters, especially CORS origins, are manageable via environment variables without requiring code changes for different environments (local, staging, production).

### Tasks
- **Modify `main.py`**:
  - Update the `CORSMiddleware` configuration.
  - Read `CORS_ORIGINS` from the environment (e.g., `os.getenv("CORS_ORIGINS", "*")`).
  - Parse the string into a list of origins (e.g., by splitting on commas).
  - Use the default `["*"]` if the variable is not set.

## 2. Docker Setup

### Objective
Create an isolated, reproducible container environment for the FastAPI backend.

### Tasks
- **Create `Dockerfile`** in the `smart-invoice-backend` folder:
  - Base image: Use a lightweight Python image (e.g., `python:3.11-slim` or `3.10-slim`).
  - Set the working directory (e.g., `/app`).
  - Copy `requirements.txt` and run `pip install --no-cache-dir -r requirements.txt`.
  - Copy the rest of the application source code.
  - Expose port `8000` (the default port for your API).
  - Define the command to start the server: `CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`.

- **Create `.dockerignore`** in the `smart-invoice-backend` folder:
  - Prevent unnecessary files from bloat the Docker image.
  - Exclude common files/directories like:
    - `venv/`
    - `__pycache__/`
    - `*.pyc`, `*.pyo`, `*.pyd`
    - `.pytest_cache/`
    - `.env` (secrets should not be baked into the image)
    - `.git/`
    - Local SQLite files (`*.db`) if any
    - `test_out.txt` and other test artifacts

## 3. Local Verification

### Objective
Ensure that the newly created Docker container can be built and run successfully on a local machine.

### Tasks
- **Build the Image**:
  - Open a terminal in the `smart-invoice-backend` directory.
  - Run: `docker build -t smart-invoice-backend:local .`
- **Run the Container**:
  - Create a `.env` file (if you haven't) with required secrets like `SUPABASE_URL`, `SUPABASE_KEY`, etc.
  - Run: `docker run -d -p 8000:8000 --env-file .env --name smart-invoice-api smart-invoice-backend:local`
- **Test Connectivity**:
  - Navigate to `http://localhost:8000/` or `http://localhost:8000/docs` in the browser.
  - Ensure the API responds successfully without errors.
- **Run Automated Tests**:
  - (Optional) Run pytest against the containerized application or simply run existing tests locally to ensure no logic was broken by the configuration tweaks.

## Future Phases
- Configure docker-compose for multi-container orchestration.
- Set up automated CI/CD pipelines to build and push the Docker image to a registry.
- Deploy the Docker image to a hosting provider (AWS, GCP, Render, Fly.io, etc.).
