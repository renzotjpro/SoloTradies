# SoloTradies AI

**AI-powered invoicing platform for Australian tradespeople.**

SoloTradies lets tradies create, manage, and send ATO-compliant invoices through natural conversation — no forms, no spreadsheets, just chat.

> *"Invoice Brett Wilson for the Westfield bathroom reno, 16 hours at $150"*
> → Invoice created, GST calculated, ABN pulled automatically. Done.

---

## Why This Exists

Australian sole traders and small trade businesses spend hours on invoicing and admin. Most invoicing tools are form-heavy and assume you're sitting at a desk. Tradies are on-site, on the go, and just want to get paid.

SoloTradies replaces forms with a conversational AI agent that understands invoicing context, handles Australian tax compliance automatically, and never asks you to type your ABN twice.

---

## Architecture

```
┌──────────────┐     ┌──────────────────────────────────────────────┐
│   Next.js    │     │          LangGraph Agent Pipeline            │
│   Frontend   │────▶│                                              │
│  (Chat UI)   │ SSE │  ┌──────────┐   ┌───────────┐   ┌────────┐ │
│              │◀────│  │ Detect   │──▶│ Extract   │──▶│Validate│ │
└──────────────┘     │  │ Intent   │   │ Data      │   │ Data   │ │
                     │  └──────────┘   └───────────┘   └────┬───┘ │
                     │       │                              │      │
                     │  greeting/                    ┌──────▼────┐ │
                     │  chitchat                     │    ATO    │ │
                     │       │                       │Compliance │ │
                     │       ▼                       │   Skill   │ │
                     │  ┌──────────┐                 └──────┬────┘ │
                     │  │ Casual   │                        │      │
                     │  │ Response │                 ┌──────▼────┐ │
                     │  └──────────┘                 │ Generate  │ │
                     │                               │ Invoice   │ │
                     └───────────────────────────────┴───────────┘ │
                                                                    │
                     ┌──────────────────────────────────────────────┘
                     │
              ┌──────▼──────┐
              │   FastAPI    │
              │   + Supabase │
              │   (PostgreSQL)│
              └──────────────┘
```

### Key Design Decisions

- **Intent detection as entry point.** Every message hits the `detect_intent` node first. Greetings and non-invoice messages never trigger the extraction pipeline — this prevents the "hi → invoice mode" bug that plagues naive agent architectures.

- **Modular compliance layer.** The ATO compliance skill (`skills/ato_compliance.py`) runs as an independent LangGraph node between validation and invoice generation. It's decoupled from the graph so it can be tested and reused in isolation.

- **Supplier ABN ≠ Client ABN.** The tradesperson's ABN is pulled automatically from `business_profiles`/`organizations` — never requested during invoice creation. Client ABNs are optional (residential clients rarely have one). This distinction is critical for correct ATO compliance.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js |
| **Backend API** | FastAPI, SQLAlchemy |
| **AI Agent** | LangGraph, LangChain |
| **Streaming** | Server-Sent Events (SSE) |
| **Database** | Supabase (PostgreSQL) |
| **Compliance** | Custom ATO validation module |

---

## Features

### Conversational Invoice Creation
Create invoices by describing the job in plain language. The agent extracts client, line items, rates, and dates — then builds the invoice.

### Intelligent Data Search
The agent searches across clients, invoices, expenses, and business profiles using:
- **Fuzzy matching** — `ILIKE` for partial name matches, typo tolerance
- **Multi-table joins** — cross-references clients ↔ invoices ↔ expenses for rich answers
- **Smart fallback** — zero-result queries trigger a cascade: fuzzy search → cross-table search → suggest alternatives → offer to create new records

### Graceful Fallback & Conversational Recovery
The agent never dead-ends a conversation. When a search returns nothing, it:
1. Acknowledges what was searched
2. Explains what was checked
3. Suggests alternatives (spelling corrections, broader search, related data)
4. Offers a concrete next action

### ATO Compliance (Australian Tax Office)
- **ABN validation** — weighted checksum algorithm per ATO spec
- **GST calculation** — automatic 10% GST for registered businesses
- **Tax invoice thresholds** — invoices ≥ $1,000 (inc. GST) enforce mandatory ABN display
- **Hard vs soft errors** — compliance violations block generation; warnings pass through with notices

### Business Profile Auto-Fill
The agent retrieves the tradesperson's ABN, business name, and contact details from their profile automatically. If the profile isn't set up, it triggers an onboarding flow before invoice creation.

### Memory-Assisted Context
Stores and retrieves per-client pricing history, preferences, and job context using the `user_memories` table — so the agent can answer questions like *"What rate do I usually charge David?"*

---

## Database Schema

```
clients              invoices              invoice_items
├── id               ├── id                ├── id
├── name             ├── invoice_number    ├── invoice_id (FK)
├── email            ├── client_id (FK)    ├── description
├── company          ├── status            ├── quantity
├── abn              ├── subtotal          ├── unit_price
├── address          ├── tax_amount        ├── amount
├── state            ├── total_amount      └── tax_rate
└── owner_id         ├── issue_date
                     ├── due_date
expenses             └── owner_id          organizations
├── id                                     ├── id
├── description      invoice_branding      ├── owner_id
├── amount           ├── id                ├── name
├── gst_included     ├── owner_id          ├── abn
├── category         ├── logo_url          ├── industry
├── expense_date     ├── business_name     ├── phone
├── client_id (FK)   ├── template_id       ├── email
├── invoice_id (FK)  └── show_client_abn   └── address_line1
└── owner_id

user_memories                 conversations
├── id                        ├── id
├── owner_id                  ├── owner_id
├── category                  ├── title
├── subject                   ├── summary
├── key                       ├── agent_state
├── value                     └── is_archived
├── confidence
└── embedding
```

All queries are scoped to `owner_id` at the application layer. Supabase Row Level Security (RLS) provides a second enforcement layer.

---

## Agent Conversation Examples

**Simple invoice creation:**
```
User: Invoice Brett for the bathroom reno, 16 hours at $150/hr
Agent: Got it! Here's the invoice for Brett Wilson:
       • Bathroom renovation labour — 16hrs × $150.00 = $2,400.00
       • GST: $240.00
       • Total: $2,640.00
       Want me to send it or make any changes?
```

**Smart search with fuzzy matching:**
```
User: I need to invoice Bretto
Agent: I had a look but couldn't spot anyone called "Bretto" in your clients, mate.
       • Did you mean Brett? I've got Brett Wilson on file.
       • I can add Bretto as a new client right now.
       What works best?
```

**Complex multi-table query:**
```
User: How much have I billed Sarah this year?
Agent: For Sarah Mitchell (Westfield Property Group) in 2026:
       • Total invoiced: $8,250.00 across 3 invoices
       • Paid: $4,950.00 (2 invoices)
       • Outstanding: $3,300.00 (1 invoice — due 15 Mar)
```

---

## Roadmap

- [x] LangGraph agent pipeline with intent detection
- [x] Conversational invoice creation
- [x] ATO compliance validation module
- [x] Fuzzy search with graceful fallback
- [x] System prompt specification & agent behaviour spec
- [ ] Full test suite for ATO compliance skill
- [ ] Authentication system (replacing hardcoded user IDs)
- [ ] Invoice branding & design customisation (inline editing UX)
- [ ] Quote-to-invoice conversion
- [ ] Partial payment tracking
- [ ] BAS reporting assistance (GST collected vs. GST paid)

---

## Project Structure

```
solotradies/
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI routes
│   │   ├── models/           # SQLAlchemy models
│   │   ├── agent/
│   │   │   ├── graph.py      # LangGraph pipeline definition
│   │   │   ├── nodes/        # detect_intent, extract_data, validate, generate
│   │   │   └── skills/       # ato_compliance.py (modular, testable)
│   │   └── services/         # Business logic, Supabase queries
│   └── requirements.txt
├── frontend/
│   └── (Next.js app)
├── docs/
│   └── agent_prompt_spec.md  # Full system prompt & search behaviour spec
└── README.md
```

---

## About

Built by **Renzo Tello Jimenez** — Senior Automation Engineer transitioning into AI Engineering. This project applies LLM agent architecture, domain-specific compliance logic, and conversational UX design to a real-world problem for Australian small businesses.

**Tech brief authoring:** All system prompt specifications and developer briefs are written to be developer-ready for handoff to external engineering teams.

[LinkedIn](https://www.linkedin.com/in/renzotellojimenez/) • [Email](mailto:renzojt@outlook.com)

---

## License

This project is proprietary. Source code is shared for portfolio and demonstration purposes.
