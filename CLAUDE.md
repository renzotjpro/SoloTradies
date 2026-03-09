# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SoloTradies ("Invoize") is an AI-powered invoicing app for tradespeople. It has a **Python/FastAPI backend** and a **Next.js frontend** with a LangGraph-based AI agent that enables conversational invoice creation.

## Architecture

**Monorepo with two apps:**
- `smart-invoice-backend/` — FastAPI + Supabase (PostgreSQL via supabase-py SDK)
- `smart-invoice-frontend/` — Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui

**Backend flow:** FastAPI routes → CRUD layer (`app/crud/crud.py`) → Supabase SDK → PostgreSQL. No SQLAlchemy — all DB access uses the supabase-py client. No migrations — run SQL manually in the Supabase dashboard using `create_tables.sql`.

**AI Agent flow:** `POST /api/chat/` (and `/api/chat/stream` for SSE) runs a LangGraph StateGraph with nodes: `classify_intent → handle_conversation | extract_basics → check_client_db → resolve_creation_preference → collect_missing_data → validate_completeness → confirm_invoice → generate_invoice`. Supports OpenAI (gpt-4o-mini), Anthropic (claude-sonnet), and DeepSeek LLMs.

**Authentication:** JWT-based via Supabase Auth. Backend uses `get_current_user()` dependency (`app/auth.py`) to extract `owner_id` from JWT (supports HS256 and ES256). Frontend uses `authFetch()` wrapper (`src/lib/api/authFetch.ts`) to attach bearer tokens. Supabase SSR SDK handles client/server auth (`src/lib/supabase/client.ts`, `server.ts`).

**Frontend flow:** Next.js App Router with a layout shell (Sidebar 264px fixed + Header wrapping all pages). State management via React Context + useReducer. API calls use `authFetch()` with try/catch — API clients are extracted to `src/lib/api/*.ts`. Forms use react-hook-form + zod. Toasts use sonner (already in root layout).

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

**Required env vars:** `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`) for the AI agent; `SUPABASE_URL` and `SUPABASE_KEY` for the DB client; `SUPABASE_JWT_SECRET` for auth.

## Key Files

### Backend
- `app/auth.py` — JWT authentication (get_current_user dependency)
- `app/crud/crud.py` — all CRUD functions (Supabase SDK, ~583 lines)
- `app/schemas/schemas.py` — all Pydantic schemas
- `app/agent/graph.py` — LangGraph StateGraph (invoice creation agent)
- `app/agent/state.py` — AgentState definition and system prompt
- `app/agent/llm.py` — LLM provider configuration (OpenAI/Anthropic/DeepSeek)
- `app/utils/pdf_generator.py` — PDF generation with Jinja2 + WeasyPrint
- `app/templates/invoice.html` — HTML invoice template
- `create_tables.sql` — all SQL table definitions (run in Supabase dashboard)
- `main.py` — router registration

### Frontend
- `src/app/layout.tsx` — root layout (sidebar + header + ThemeProvider + ColorThemeProvider + Toaster)
- `src/lib/theme-colors.tsx` — ColorThemeProvider with 6 brand palettes
- `src/lib/context/BrandingContext.tsx` — branding context (React Context + useReducer)
- `src/lib/api/` — API client modules (one file per domain)
- `src/lib/api/authFetch.ts` — authenticated fetch wrapper (attaches JWT)
- `src/lib/hooks/useChat.ts` — chat hook with streaming support
- `src/lib/supabase/client.ts` / `server.ts` — Supabase client initialization
- `src/lib/types/` — TypeScript type definitions (chat, organization)

## Backend Routers

| Router | Prefix | Description |
|--------|--------|-------------|
| clients | `/clients` | Client CRUD |
| invoices | `/invoices` | Invoice CRUD + PDF export (`GET /invoices/{id}/pdf`) |
| expenses | `/expenses` | Expense tracking with GST calculation |
| organization | `/organization` | Business profile management |
| branding | `/api/v1/branding` | Invoice branding settings |
| dashboard | `/api/v1/dashboard` | Overview stats, cashflow, invoice status |
| chat | `/api/chat` | AI agent (regular + SSE streaming) |

## Frontend Routes

| Route | Description |
|-------|-------------|
| `/(auth)/login` | Login page (email/password + social) |
| `/(auth)/signup` | Registration page |
| `/(auth)/callback` | Supabase auth callback |
| `/(dashboard)` | Dashboard with stats, cashflow chart, invoice status chart |
| `/(dashboard)/chat` | AI chat home (example prompts, recent chats) |
| `/(dashboard)/create` | Active AI chat conversation |
| `/(dashboard)/invoices` | Invoice list |
| `/(dashboard)/invoices/new` | Invoice creation with line items + live preview |
| `/(dashboard)/invoices/[id]` | Invoice detail view |
| `/(dashboard)/clients` | Client list |
| `/(dashboard)/clients/new` | New client form |
| `/(dashboard)/clients/[id]` | Client detail view |
| `/(dashboard)/clients/[id]/edit` | Edit client form |
| `/settings` | Profile, theme, and general settings |
| `/settings/branding` | Invoice branding customizer |

## Key Conventions

- **Frontend:** App Router (not Pages Router), `"use client"` on all interactive pages, `@/*` path alias maps to `src/*`, shadcn/ui (new-york style, Lucide icons), emerald-600 as primary brand color.
- **Frontend state:** React Context + useReducer (no Zustand). See `BrandingContext.tsx` as the reference pattern.
- **Frontend API calls:** `authFetch()` with try/catch, no axios or react-query. Extract API logic to `src/lib/api/*.ts`.
- **Frontend forms:** react-hook-form + zod. See `src/app/settings/components/edit-profile-form.tsx`.
- **Auto-save:** debounce 800ms for text inputs, immediate for toggles/color pickers.
- **Backend:** APIRouter with prefix/tags, Pydantic schemas separate from DB logic, `get_current_user()` dependency for auth.
- **Naming:** Python uses snake_case files/functions, PascalCase classes. TypeScript uses PascalCase component files, camelCase functions, kebab-case route directories.
- **Tax:** 10% default tax rate for invoice items, GST 1/11 for expenses (Australian tax system).
- **Currency:** AUD formatting throughout.

## Key Dependencies

### Frontend
- `@supabase/ssr`, `@supabase/supabase-js` — auth & DB
- `@dnd-kit/core`, `@dnd-kit/sortable` — drag-and-drop line item reordering
- `recharts` — dashboard charts (AreaChart, BarChart)
- `next-themes` — light/dark/system theme switching
- `react-markdown` — markdown rendering in chat
- `html2pdf.js` — client-side PDF export

### Backend
- `langgraph`, `langchain`, `langchain-openai`, `langchain-anthropic` — AI agent
- `weasyprint`, `jinja2` — server-side PDF generation
- `reportlab` — PDF utilities

## Pre-existing Lint Errors (Do Not Fix Unless Asked)

3 errors in existing files: `industry-combobox.tsx`, `client-combobox.tsx`, `theme-colors.tsx` (setState called inside useEffect).

## Current Limitations

- `generate_invoice` node in the LangGraph graph is a stub (doesn't create invoice in DB yet).
- Subscription/billing tab exists in settings UI but has no implementation.
- No unit/integration tests beyond pytest configuration.
- CORS is wildcard (`*`) for development only.
