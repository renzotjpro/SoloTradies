# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SoloTradies ("Invoize") is an AI-powered invoicing app for tradespeople. It has a **Python/FastAPI backend** and a **Next.js frontend** with a LangGraph-based AI agent that enables conversational invoice creation.

## Architecture

**Monorepo with two apps:**
- `smart-invoice-backend/` — FastAPI + Supabase (PostgreSQL via supabase-py SDK)
- `smart-invoice-frontend/` — Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui

**Backend flow:** FastAPI routes → CRUD layer (`app/crud/crud.py`) → Supabase SDK → PostgreSQL. No SQLAlchemy — all DB access uses the supabase-py client. No migrations — run SQL manually in the Supabase dashboard using `create_tables.sql`. The AI chat endpoint (`POST /api/chat/`) runs a LangGraph StateGraph: `extract_information → validate_data → [generate_invoice if complete, else wait for more input]`.

**Frontend flow:** Next.js App Router with a layout shell (Sidebar 264px fixed + Header wrapping all pages). State management via React Context + useReducer. API calls use direct `fetch()` with try/catch — API clients are extracted to `src/lib/api/*.ts`. Forms use react-hook-form + zod. Toasts use sonner (already in root layout).

**Key integration point:** Frontend calls the backend at `http://localhost:8000`.

## Commands

### Frontend (run from `smart-invoice-frontend/`)
```bash
npm run dev          # Dev server on http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
```

### Backend (run from `smart-invoice-backend/`)
```bash
uvicorn main:app --reload    # Dev server on http://localhost:8000
pytest                       # Run tests
pip install -r requirements.txt  # Install deps
```

**Required env vars:** `OPENAI_API_KEY` for the AI agent; Supabase credentials for the DB client.

## Key Files

- `smart-invoice-backend/create_tables.sql` — all SQL table definitions (run in Supabase dashboard)
- `smart-invoice-backend/app/schemas/schemas.py` — all Pydantic schemas
- `smart-invoice-backend/app/crud/crud.py` — all CRUD functions (Supabase SDK)
- `smart-invoice-backend/main.py` — router registration
- `smart-invoice-frontend/src/app/layout.tsx` — root layout (sidebar + header + ThemeProvider + ColorThemeProvider + Toaster)
- `smart-invoice-frontend/src/lib/theme-colors.tsx` — ColorThemeProvider with 6 brand palettes
- `smart-invoice-frontend/src/lib/context/BrandingContext.tsx` — branding context (React Context + useReducer)
- `smart-invoice-frontend/src/lib/api/` — API client modules (one file per domain)

## Key Conventions

- **Frontend:** App Router (not Pages Router), `"use client"` on all interactive pages, `@/*` path alias maps to `src/*`, shadcn/ui (new-york style, Lucide icons), emerald-600 as primary brand color
- **Frontend state:** React Context + useReducer (no Zustand). See `BrandingContext.tsx` as the reference pattern.
- **Frontend API calls:** direct `fetch()` with try/catch, no axios or react-query. Extract API logic to `src/lib/api/*.ts`.
- **Frontend forms:** react-hook-form + zod. See `src/app/settings/components/edit-profile-form.tsx`.
- **Auto-save:** debounce 800ms for text inputs, immediate for toggles/color pickers.
- **Backend:** APIRouter with prefix/tags, Pydantic schemas separate from DB logic, hardcoded `owner_id = 1` (no auth yet), CORS wildcard (`*`) for development.
- **Naming:** Python uses snake_case files/functions, PascalCase classes. TypeScript uses PascalCase component files, camelCase functions, kebab-case route directories.

## Implemented Features

- `/settings/branding` — invoice branding settings (logo, colors, content toggles, custom labels). Backend router at `/api/v1/branding`. Tables: `invoice_branding_settings`, `invoice_custom_labels`.
- `/settings` — profile, theme, and general settings pages.
- `/invoices/new` — invoice creation page with client selection, line item management, and live preview.
- AI chat agent (`/create`) — LangGraph-based conversational invoice creation.

## Pre-existing Lint Errors (Do Not Fix Unless Asked)

3 errors in existing files: `industry-combobox.tsx`, `client-combobox.tsx`, `theme-colors.tsx` (setState called inside useEffect).

## Current Limitations

- No authentication — `owner_id` is hardcoded to `1` everywhere.
- `generate_invoice` node in the LangGraph graph is a stub (no PDF generation yet).
- CORS is wildcard (`*`) for development only.
