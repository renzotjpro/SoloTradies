# Bug Roadmap: Agent Mixes Client & Invoice Fields

**File:** `smart-invoice-backend/app/agent/`  
**Reported:** 2026-02-26  
**Status:** Planned — Ready to Implement

---

## 1. Problem Summary

When a user says _"Invoice Acme Corp for website redesign"_, the agent incorrectly asks for **Contact Name, ABN, and Email** alongside invoice fields like **Amount** and **Date**. Contact Name, ABN, and Email are client registration fields and should only be requested when a client is genuinely new to the system.

**Root cause:** The LangGraph agent uses a single flat extraction + validation flow. It asks the LLM to guess whether a client is new (via `is_new_client: bool`) without first checking the database. This causes the wrong validation branch to fire and dumps client-registration questions into what should be a simple invoice conversation.

---

## 2. Current (Broken) Flow

```
User message
    └─► extract_information   ← LLM guesses is_new_client (no DB check)
          └─► validate_data   ← Validates ALL fields at once (client + invoice)
                └─► confirm_invoice
                      └─► generate_invoice
```

**Key problems:**
- `is_new_client` is set by the LLM with no database evidence
- `validate_data` asks for client fields (ABN, Contact, Email) even for existing clients
- The DB lookup is an afterthought deep inside `validate_data`, not a routing decision

---

## 3. Desired Behaviour

### Flow 1 — Client exists in DB
```
User: "Invoice Acme Corp for website redesign"
Agent: [DB lookup → found]
Agent: "I found Acme Corp. I just need:
  - Amount for the website redesign
  - Date of service (or should I use today?)"
```

### Flow 2 — Client NOT found in DB
```
User: "Invoice Unknown Corp for website redesign"
Agent: [DB lookup → not found]
Agent: "I don't have Unknown Corp in your client list. Would you like me to:
  1. Create Unknown Corp as a new client first, then create the invoice?
  2. Just create the invoice with the name Unknown Corp for now?"
```

**Option 1 chosen:** Agent asks for Business Name, ABN, Contact Name, Email + invoice fields.  
**Option 2 chosen:** Agent asks for Amount, Date + ABN only (ABN is always required for invoices).

---

## 4. Proposed Architecture

### 4.1 New Graph Flow

```
START
  └─► extract_basics
        └─► check_client_db
              ├─► [existing]   validate_existing_client
              │                   └─► confirm_invoice → generate_invoice → END
              └─► [not_found]  ask_creation_preference  (wait for user reply)
                    └─► resolve_creation_preference
                          ├─► [full]   validate_new_client_full
                          │               └─► confirm_invoice → generate_invoice → END
                          └─► [quick]  validate_quick_invoice
                                          └─► confirm_invoice → generate_invoice → END
```

### 4.2 Files to Change

| File | Change |
|------|--------|
| `app/agent/state.py` | Add new `AgentState` fields; add `BasicExtraction` schema |
| `app/agent/graph.py` | Replace all nodes and routing with new flow |
| `tests/test_agent.py` | Update to match new state shape |

---

## 5. State Changes (`state.py`)

### New `AgentState` fields

| Field | Type | Purpose |
|-------|------|---------|
| `client_status` | `Optional[str]` | `"existing"` or `"not_found"` — set by DB lookup |
| `creation_preference` | `Optional[str]` | `"full"` or `"quick"` — set by user's option choice |
| `resolved_client_id` | `Optional[int]` | DB `id` of found existing client — avoids duplicate lookup in `generate_invoice` |

### New `BasicExtraction` schema

Lightweight Pydantic model used by the first LLM call. Contains only:
- `client_name`
- `items` (description + amount)
- `date` / `due_date`

**No `is_new_client` or `new_client_details`** — client type is determined by the DB, not the LLM.

---

## 6. New Nodes (`graph.py`)

| Node | Responsibility |
|------|---------------|
| `extract_basics` | LLM call using `BasicExtraction` schema — extracts client name, line items, date only |
| `check_client_db` | Supabase lookup by `client_name`; sets `client_status` and `resolved_client_id` |
| `ask_creation_preference` | Sends the two-option message; returns `END` to pause and wait for user reply |
| `resolve_creation_preference` | LLM parses user's reply into `creation_preference = "full"` or `"quick"` |
| `validate_existing_client` | Validates invoice fields only: `items` (description + amount) and `date` |
| `validate_new_client_full` | Validates invoice fields + `new_client_details` (business name, ABN, contact, email) |
| `validate_quick_invoice` | Validates invoice fields + ABN only |
| `confirm_invoice` | Unchanged logic; summary display updated to handle all three paths |
| `generate_invoice` | Uses `resolved_client_id` if set; creates client record first if new |

---

## 7. Routing Functions

| Router | When it fires | Decision |
|--------|--------------|---------|
| `route_after_db_check` | After `check_client_db` | `"existing"` → `validate_existing_client`; `"not_found"` → `ask_creation_preference` |
| `route_after_preference` | After `resolve_creation_preference` | `"full"` → `validate_new_client_full`; `"quick"` → `validate_quick_invoice`; else → `END` |
| `route_after_validation` | After any validate node | `is_complete` → `confirm_invoice`; else → `END` |
| `route_after_confirmation` | After `confirm_invoice` | `user_confirmed` → `generate_invoice`; else → `END` |

---

## 8. Implementation Order

1. `state.py` — Add new state fields + `BasicExtraction` schema
2. `graph.py` — Implement nodes in dependency order:
   - `extract_basics`
   - `check_client_db`
   - `ask_creation_preference` + `resolve_creation_preference`
   - `validate_existing_client`, `validate_new_client_full`, `validate_quick_invoice`
   - Update `confirm_invoice` and `generate_invoice`
3. `graph.py` — Rewire routing and `StateGraph` definition
4. `tests/test_agent.py` — Update state initialisation to include new fields

---

## 9. Verification Checklist

- [ ] **Flow 1:** `Invoice Acme Corp for website redesign` → agent asks Amount + Date only (no ABN/Contact/Email)
- [ ] **Flow 2a:** Unknown client → option `1` → agent asks Business Name, ABN, Contact, Email, Amount, Date
- [ ] **Flow 2b:** Unknown client → option `2` → agent asks Amount, Date, ABN only
- [ ] Existing client with missing ABN on file → agent prompts for ABN update
- [ ] `confirm_invoice` summary displays correctly for all three paths
- [ ] `generate_invoice` creates the client record before the invoice in Flow 2a
- [ ] All existing tests pass (or are updated to reflect new state shape)
