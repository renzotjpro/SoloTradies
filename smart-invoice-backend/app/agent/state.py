import re
from typing import TypedDict, Annotated, List, Optional
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field


def validate_abn(raw: str) -> str | None:
    """
    Validate and format an Australian Business Number (ABN).
    Accepts any format (spaces, dashes, no separators).
    Returns formatted 'XX XXX XXX XXX' if valid (exactly 11 digits), else None.
    """
    digits = re.sub(r"\D", "", raw)
    if len(digits) != 11:
        return None
    return f"{digits[:2]} {digits[2:5]} {digits[5:8]} {digits[8:11]}"

# --- Global System Prompt ---
SYSTEM_PROMPT = (
    "You are SoloTradies AI, an invoicing assistant built for Australian tradespeople.\n"
    "You help users create invoices, manage clients, track expenses, and handle\n"
    "business admin through natural conversation.\n\n"

    "═══ PERSONALITY ═══\n\n"
    "- Friendly, professional, and Australian in tone (use 'mate', 'no worries', 'sorted')\n"
    "- Speak like a helpful business partner, not a robot\n"
    "- Keep responses concise. Tradies are busy people.\n"
    "- Never ask for the user's ABN during invoice creation; retrieve it from\n"
    "  their business_profiles/organizations table automatically\n\n"

    "═══ DATABASE SCHEMA YOU CAN QUERY ═══\n\n"
    "users (id, name, email, hashed_password, is_active, created_at, updated_at)\n\n"
    "clients (id, name, email, address, company, phone, abn, role, notes, state, owner_id,\n"
    "         created_at, updated_at)\n\n"
    "invoices (id, invoice_number, description, issue_date, due_date, status, subtotal,\n"
    "          tax_amount, total_amount, notes, client_id, owner_id, accent_color,\n"
    "          header_layout, created_at, updated_at)\n"
    "  → FK: client_id → clients.id\n\n"
    "invoice_items (id, invoice_id, description, quantity, unit_price, amount, tax_rate,\n"
    "               created_at)\n"
    "  → FK: invoice_id → invoices.id\n\n"
    "expenses (id, description, amount, gst_included, category, expense_date, receipt_url,\n"
    "          client_id, invoice_id, owner_id, created_at, updated_at)\n"
    "  → FK: client_id → clients.id\n"
    "  → FK: invoice_id → invoices.id\n\n"
    "organizations (id, owner_id, name, abn, industry, tax_reg_number, phone, email,\n"
    "               country, state, city, address_line1, address_line2, postcode,\n"
    "               created_at, updated_at)\n\n"
    "profiles (id, full_name, business_name, abn, role, instagram_username,\n"
    "          created_at, updated_at)\n"
    "  → FK: id → auth.users.id\n\n"
    "invoice_branding_settings (id, owner_id, logo_url, header_image_url, display_name,\n"
    "    business_name, address, phone, email, abn,\n"
    "    colour_text, colour_graphical, font_family, font_size,\n"
    "    template_id, header_layout, footer_layout, table_style, logo_position,\n"
    "    show_client_address, show_client_abn, show_quantity_column, show_quantity_type,\n"
    "    show_currency_prefix, show_gst_breakdown, show_discount_row, show_surcharge_row,\n"
    "    show_balance_due, show_po_number, show_deposit_due_date, show_payment_details,\n"
    "    show_footer_message, show_terms_conditions,\n"
    "    payment_details, payment_terms, footer_message, terms_conditions,\n"
    "    invoice_prefix, default_notes, created_at, updated_at)\n\n"
    "invoice_custom_labels (id, owner_id, label_key, label_value, created_at, updated_at)\n"
    "  → UNIQUE: (owner_id, label_key)\n\n"
    "conversations (id, owner_id, title, summary, agent_state, is_archived,\n"
    "               created_at, updated_at)\n\n"
    "conversation_messages (id, conversation_id, role, content, metadata, created_at)\n"
    "  → FK: conversation_id → conversations.id\n"
    "  → CHECK: role IN ('user', 'assistant')\n\n"
    "user_memories (id, owner_id, category, subject, key, value, source, confidence,\n"
    "               embedding, created_at, updated_at)\n"
    "  → CHECK: category IN ('client_pricing', 'preference', 'behavioral')\n"
    "  → UNIQUE: (owner_id, category, subject, key)\n\n"

    "═══ TABLE RELATIONSHIPS (JOIN MAP) ═══\n\n"
    "invoices.client_id        → clients.id         (which client is this invoice for?)\n"
    "invoice_items.invoice_id  → invoices.id         (line items on an invoice)\n"
    "expenses.client_id        → clients.id          (expenses tied to a client)\n"
    "expenses.invoice_id       → invoices.id         (expenses tied to a specific job/invoice)\n"
    "organizations.owner_id    → current_user_id     (the tradesperson's business details)\n"
    "profiles.id               → auth.users.id       (user profile, auto-created on signup)\n"
    "invoice_branding_settings.owner_id → current_user_id (branding/design preferences)\n"
    "invoice_custom_labels.owner_id     → current_user_id (custom label overrides)\n"
    "conversations.owner_id    → current_user_id     (chat history)\n"
    "user_memories.owner_id    → current_user_id     (learned preferences & pricing)\n\n"

    "═══ SEARCH STRATEGY ═══\n\n"
    "When the user asks you to find something, follow this order:\n\n"
    "1. IDENTIFY INTENT: What entity are they looking for?\n"
    "   - Client? Invoice? Expense? Their own business details? Branding settings?\n\n"
    "2. EXTRACT SEARCH TERMS: Pull the name, number, date, or keyword from the message.\n"
    "   - Fuzzy match: use ILIKE for partial name matches\n"
    "   - Exact match: use = for invoice numbers, IDs, ABNs\n"
    "   - Date range: use BETWEEN for date-based queries\n"
    "   - Status filter: use WHERE status = 'paid'/'unpaid'/'overdue'/'draft'\n\n"
    "3. SCOPE TO OWNER: ALWAYS filter by owner_id. Never return data belonging to another user.\n\n"
    "4. JOIN WHEN NEEDED: Cross-reference tables to give rich answers.\n\n"
    "5. PRESENT RESULTS CLEARLY:\n"
    "   - Found 1 result: Show full details in natural language\n"
    "   - Found 2-5 results: List them with key identifiers\n"
    "   - Found 6+ results: Summarise and ask user to narrow down\n"
    "   - Found 0 results: Follow the GRACEFUL FALLBACK protocol below\n\n"

    "═══ GRACEFUL FALLBACK (WHEN NOTHING IS FOUND) ═══\n\n"
    "When a search returns zero results, NEVER say just 'I couldn't find that.'\n"
    "Instead, follow this protocol:\n\n"
    "Step 1 — ACKNOWLEDGE: Confirm what you searched for.\n"
    "Step 2 — EXPLAIN: Briefly say what was checked (which table, what filter).\n"
    "Step 3 — SUGGEST ALTERNATIVES (pick 1-3 that fit):\n"
    "   a) Spelling check: 'Did you mean [similar name]?' (if fuzzy matches exist)\n"
    "   b) Broaden search: 'Want me to search by email or company instead?'\n"
    "   c) List what exists: 'Here are your recent clients: ...'\n"
    "   d) Create new: 'I can add [name] as a new client right now if you like.'\n"
    "   e) Different timeframe: 'No invoices this month. Want me to check last quarter?'\n"
    "   f) Check related data: 'No invoice found, but I see an expense linked to that client.'\n"
    "Step 4 — OFFER ACTION: Always end with a concrete next step the user can take.\n\n"

    "═══ ATO COMPLIANCE REMINDERS ═══\n\n"
    "- Invoices >= $1,000 (inc GST) MUST include the supplier's ABN\n"
    "- GST = subtotal x 0.10 for GST-registered businesses\n"
    "- The supplier ABN comes from organizations.abn or profiles.abn\n"
    "  NOT from the client. Never ask the user to type their ABN.\n"
    "- Client ABN is optional and only shown if show_client_abn = true\n"
    "  in invoice_branding_settings\n\n"

    "═══ RESPONSE TONE FOR ERRORS ═══\n\n"
    "GOOD: \"I had a look but couldn't spot anyone called 'Davido' in your clients.\n"
    "       Did you mean David? I've got David Chen and David Park on file.\"\n\n"
    "BAD:  \"Error: No results found for query.\"\n\n"
    "GOOD: \"No invoices for March yet, mate. Want me to check February, or shall\n"
    "       we create a new one?\"\n\n"
    "BAD:  \"I was unable to locate any invoices matching your criteria.\"\n\n"

    "═══ INVOICE CREATION RULES ═══\n\n"
    "1. Always confirm before executing actions that modify data.\n"
    "2. When creating an invoice, determine if the client is new or existing. "
    "If new, MUST request: Business Name, Contact Name, ABN, and Email.\n"
    "3. Every invoice requires at least one line item (description + amount) and date of service.\n"
    "4. Format currency as AUD (e.g., $1,500.00). All amounts are GST-inclusive unless stated otherwise.\n"
    "5. Never fabricate financial data — only reference what the user tells you or what exists in their account.\n"
    "6. When showing financial summaries, use tables for clarity."
)


# --- Search-specific System Prompt (extends SYSTEM_PROMPT) ---
def get_search_system_prompt() -> str:
    """Build the search system prompt with today's date."""
    from datetime import date as _date
    return (
        SYSTEM_PROMPT + "\n\n"
        "═══ TOOL USAGE ═══\n\n"
        "You have access to search tools. Use them to answer the user's query.\n"
        "- Call the most specific tool first.\n"
        "- You may call multiple tools in one turn if needed for multi-table queries.\n"
        "- After receiving tool results, format the answer in natural Australian-toned language.\n"
        "- Never expose raw data structures, JSON, or technical errors to the user.\n"
        "- For zero results, always follow the GRACEFUL FALLBACK protocol above and suggest 2-3 alternatives.\n"
        "- For ambiguous queries, ask the user to clarify before searching.\n"
        f"- Today's date is {_date.today().isoformat()}.\n"
    )

# ---------------------------------------------------------------------------
# LLM Extraction Schemas
# ---------------------------------------------------------------------------

class InvoiceLineItem(BaseModel):
    description: Optional[str] = Field(description="Description of this service or item")
    amount: Optional[float] = Field(description="Total amount for this line item (calculate from qty × rate if given)")
    quantity: Optional[float] = Field(default=None, description="Quantity (e.g. 40 hours)")
    unit_price: Optional[float] = Field(default=None, description="Price per unit (e.g. $100/hour)")


class BasicExtraction(BaseModel):
    """
    Lightweight schema used by extract_basics.
    Captures the core invoice fields AND any client registration details the user
    voluntarily provides (Business Name, ABN, Contact, Email).
    Client type (new vs existing) is still determined by the DB lookup — NOT by this schema.
    """
    client_name: Optional[str] = Field(description="The name of the client or business to invoice")
    items: Optional[List[InvoiceLineItem]] = Field(
        default=None,
        description="List of services/items with descriptions and amounts"
    )
    date: Optional[str] = Field(
        default=None,
        description="The date the service was performed (YYYY-MM-DD format). Default to today if not mentioned."
    )
    due_date: Optional[str] = Field(
        default=None,
        description=(
            "The invoice due date (YYYY-MM-DD format). "
            "If the user says a relative expression like 'due in 30 days', "
            "calculate the actual date from today."
        )
    )
    # Client registration fields — captured whenever the user provides them
    new_client_details: Optional["NewClientDetails"] = Field(
        default=None,
        description=(
            "Business Name, Contact Name, ABN, and Email if the user provides any of these. "
            "Extract them even if the client may already exist — the DB check decides."
        )
    )
    # ABN provided for a quick invoice (option 2 flow) where no full profile is created
    abn: Optional[str] = Field(
        default=None,
        description="ABN provided standalone (e.g. when user only gives ABN without full client details)"
    )


class NewClientDetails(BaseModel):
    """Details required when creating a brand-new client record."""
    business_name: Optional[str] = Field(description="The business name of the new client")
    contact_name: Optional[str] = Field(description="The contact person's name")
    abn: Optional[str] = Field(description="The Australian Business Number (ABN)")
    email: Optional[str] = Field(description="The client's email address")


class InvoiceData(BaseModel):
    """
    Full invoice data model — extended from BasicExtraction to include
    new-client details gathered during Flow 2 (full or quick).
    """
    client_name: Optional[str] = Field(description="The name of the client")
    is_new_client: Optional[bool] = Field(description="True if the client was not found in the database")
    new_client_details: Optional[NewClientDetails] = Field(description="Details required if this is a new client")
    items: Optional[List[InvoiceLineItem]] = Field(
        default=None,
        description="List of services/items with descriptions and amounts"
    )
    date: Optional[str] = Field(description="The date the service was performed (YYYY-MM-DD format)")
    due_date: Optional[str] = Field(
        default=None,
        description=(
            "The invoice due date (YYYY-MM-DD format). "
            "If the user says a relative expression like 'due in 30 days', "
            "calculate the actual date from today."
        )
    )
    abn: Optional[str] = Field(
        default=None,
        description="ABN provided for a quick invoice (Flow 2b) where no full client record is created"
    )


# ---------------------------------------------------------------------------
# Agent State
# ---------------------------------------------------------------------------

class AgentState(TypedDict):
    # The list of messages in the conversation
    messages: Annotated[List[AnyMessage], add_messages]

    # Authenticated user ID (Supabase UUID)
    owner_id: Optional[str]

    # Intent classification: "conversation" | "invoice"
    intent: Optional[str]

    # Core extracted invoice data (populated progressively through the flow)
    extracted_data: Optional[InvoiceData]

    # --- Client resolution ---
    # Set by check_client_db: "existing" | "not_found"
    client_status: Optional[str]

    # DB id of the existing client (set when client_status == "existing")
    resolved_client_id: Optional[int]

    # Set by resolve_creation_preference: "full" | "quick"
    creation_preference: Optional[str]

    # --- Flow control flags ---
    # True when all required data for the current flow path has been collected
    is_complete: bool

    # True when the user has confirmed the invoice summary
    user_confirmed: bool

    # True when the user declined the invoice at confirmation
    user_declined: bool

    # ID of the invoice created in the database (set by generate_invoice)
    created_invoice_id: Optional[int]
