# Database Migration Roadmap: SQLite to Supabase

## Project Overview
**Target Project:** SoloTradies

**Target State:** Supabase PostgreSQL with enhanced schema — line items, tax tracking (GST), timestamps, and expense tracking for BAS reporting.

---

## Strategic Goals
1. **Robustness & Scalability:** Move from file-based SQLite to a production-ready PostgreSQL instance managed by Supabase.
2. **Schema Enhancement:** Add line items, per-item GST tax rates, audit timestamps (`created_at`, `updated_at`), and invoice notes.
3. **Expense Tracking:** New `expenses` table to track business costs (materials, fuel, tools, insurance) for BAS reporting and per-job profit calculation.
4. **Future-proofing:** Prepare the data layer for real-time features, authentication, and multi-tenant capabilities.

---

## Database Schema (5 Tables)

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | |
| name | String | indexed |
| email | String | unique, indexed |
| hashed_password | String | |
| is_active | Boolean | default true |
| created_at | DateTime | auto |
| updated_at | DateTime | auto |

### `clients`
| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | |
| name | String | indexed |
| email | String | nullable, indexed |
| address | String | nullable |
| company | String | nullable |
| phone | String | nullable |
| abn | String | nullable |
| role | String | nullable |
| notes | String | nullable |
| owner_id | FK → users.id | |
| created_at | DateTime | auto |
| updated_at | DateTime | auto |

### `invoices`
| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | |
| invoice_number | String | unique, indexed |
| description | String | nullable (kept for backward compat) |
| issue_date | DateTime | default now |
| due_date | DateTime | nullable |
| status | String | Draft, Sent, Paid, Overdue |
| subtotal | Float | sum of line item amounts |
| tax_amount | Float | sum of line item taxes |
| total_amount | Float | subtotal + tax_amount |
| notes | String | nullable (payment terms, etc.) |
| client_id | FK → clients.id | |
| owner_id | FK → users.id | |
| created_at | DateTime | auto |
| updated_at | DateTime | auto |

### `invoice_items`
| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | |
| invoice_id | FK → invoices.id | cascade delete |
| description | String | not null |
| quantity | Float | default 1 |
| unit_price | Float | not null |
| amount | Float | quantity × unit_price |
| tax_rate | Float | default 0.10 (10% GST) |
| created_at | DateTime | auto |

### `expenses`
| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | |
| description | String | not null |
| amount | Float | total paid (GST-inclusive) |
| gst_included | Float | auto-calculated: amount / 11 |
| category | String | Materials, Fuel, Insurance, Tools, Other |
| expense_date | DateTime | not null |
| receipt_url | String | nullable (future file upload) |
| client_id | FK → clients.id | nullable (link to client) |
| invoice_id | FK → invoices.id | nullable (link to job) |
| owner_id | FK → users.id | not null |
| created_at | DateTime | auto |
| updated_at | DateTime | auto |

**Why `gst_included` matters:** In Australia, GST is 1/11 of the total price. Tradies claim this back on their quarterly BAS. Auto-calculating it saves manual work and reduces errors.

**Why `client_id` and `invoice_id` on expenses:** Optional links let the tradie see true profit per job (invoice total minus linked expenses). Standalone expenses (fuel, insurance) have these as null.

---

## Phase 1: Preparation & Setup ✅
- [x] **Create Supabase Project:** Initialized.
- [x] **Retrieve Credentials:** `DATABASE_URL` obtained from Supabase dashboard.
- [x] **Configure Environment Variables:** Added `DATABASE_URL` to `.env`.
- [x] **Dependency Updates:** Added `psycopg2-binary` to `requirements.txt`.

---

## Phase 2: Schema Design & Enhancement ✅
- [x] **Global Enhancements:** Added `created_at` and `updated_at` to all models.
- [x] **Users Table:** Added `is_active` flag.
- [x] **Clients Table:** Added `notes` field.
- [x] **Invoices Table:** Added `subtotal`, `tax_amount`, `total_amount`, `notes`. Removed flat `amount` (replaced by computed `total_amount`).
- [x] **Invoice Items Table:** New table with `description`, `quantity`, `unit_price`, `amount`, `tax_rate`.
- [x] **Expenses Table:** New table with `description`, `amount`, `gst_included`, `category`, `expense_date`, `receipt_url`, optional `client_id`/`invoice_id` links.

---

## Phase 3: Application Code Updates ✅
- [x] **`database.py`:** Reads `DATABASE_URL` from env, removed SQLite `check_same_thread` workaround.
- [x] **`models/models.py`:** Enhanced schema with all new models and relationships.
- [x] **`schemas/schemas.py`:** Added `InvoiceItemCreate`, `InvoiceItemResponse`, `ExpenseCreate`, `ExpenseUpdate`, `Expense`, `DashboardStats`. Updated invoice and client schemas.
- [x] **`crud/crud.py`:** Invoice creation computes line item totals in transaction. Full expense CRUD with auto GST calculation. Dashboard stats query.
- [x] **`api/expenses.py`:** New router with GET (filterable), POST, PUT, DELETE endpoints.
- [x] **`main.py`:** Registered expenses router.
- [x] **`agent/state.py`:** Updated `InvoiceData` to support list of line items.
- [x] **`agent/graph.py`:** Updated validation logic for new items structure.

---

## Phase 4: Migration Execution
- [ ] **Set DATABASE_URL:** Paste your Supabase connection string into `.env`.
- [ ] **Install dependencies:** `pip install -r requirements.txt`
- [ ] **Start backend:** `uvicorn main:app --reload` — `create_all()` auto-generates tables on Supabase.
- [ ] **Seed user:** Create a user via Swagger `/docs` (needed because `owner_id = 1` is hardcoded).
- [ ] **Back up SQLite:** Archive `sql_app.db` — it's no longer used.

---

## Phase 5: Testing & Validation
- [ ] **Swagger API Testing:** Create user → create client → create invoice with line items → verify computed subtotal/tax/total. Create expenses → verify `gst_included` auto-calculated.
- [ ] **Expense Filtering:** Test `GET /expenses/?category=Fuel`, `GET /expenses/?client_id=1`, `GET /expenses/?invoice_id=1`.
- [ ] **Frontend Integration:** Verify clients page and chat page still work with the updated backend.
- [ ] **Supabase Dashboard:** Check all 5 tables, relationships, constraints, and data in the Supabase table editor.

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/expenses/` | List expenses (filterable by category, client_id, invoice_id) |
| GET | `/expenses/{id}` | Get single expense |
| POST | `/expenses/` | Create expense (auto-calculates GST) |
| PUT | `/expenses/{id}` | Update expense (recalculates GST if amount changes) |
| DELETE | `/expenses/{id}` | Delete expense |
| GET | `/invoices/` | List invoices (now includes line items) |
| POST | `/invoices/` | Create invoice with line items (auto-computes totals) |

## Expense Categories
- **Materials** — parts, supplies purchased for jobs (e.g., tap set from Bunnings)
- **Fuel** — vehicle fuel for work travel
- **Tools** — equipment purchases (drills, saws, etc.)
- **Insurance** — public liability, professional indemnity
- **Other** — anything else (training, software, uniforms)
