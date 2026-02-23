# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SoloTradies ("Invoize") is an AI-powered invoicing app for tradespeople. It has a **Python/FastAPI backend** and a **Next.js frontend** with a LangGraph-based AI agent that enables conversational invoice creation.

## Architecture

**Monorepo with two apps:**
- `smart-invoice-backend/` — FastAPI + SQLAlchemy + LangGraph agent
- `smart-invoice-frontend/` — Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui

**Backend flow:** FastAPI routes → CRUD layer → SQLAlchemy models → SQLite DB. The AI chat endpoint (`POST /api/chat/`) runs a LangGraph StateGraph: `extract_information → validate_data → [generate_invoice if complete, else wait for more input]`.

**Frontend flow:** Next.js App Router with a layout shell (Sidebar + Header wrapping all pages). The `/create` page calls the backend chat API directly. Dashboard and Settings pages currently use hardcoded mock data.

**Key integration point:** Frontend (`/create`) calls `http://localhost:8000/api/chat/` sending full conversation history.

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

**Required env var:** `OPENAI_API_KEY` must be set for the backend AI agent to work.

## Key Conventions

- **Frontend:** App Router (not Pages Router), `"use client"` directive for interactive pages, `@/*` path alias maps to `src/*`, shadcn/ui configured (new-york style, neutral base, Lucide icons), emerald-600 as primary brand color
- **Backend:** APIRouter with prefix/tags, Pydantic schemas separate from SQLAlchemy models, dependency injection for DB sessions, hardcoded `owner_id = 1` (no auth yet)
- **Naming:** Python uses snake_case files/functions, PascalCase classes. TypeScript uses PascalCase component files, camelCase functions, kebab-case route directories

## Current State (MVP)

- Only `/create` page has live backend integration
- Most sidebar nav links (invoices, payments, clients, reports, help) have no pages yet
- `generate_invoice` node in the LangGraph graph is a stub (no PDF generation or DB save yet)
- CORS is wildcard (`*`) for development
- SQLite used intentionally for MVP simplicity
