import logging
import uuid
from datetime import date, datetime
from typing import Optional

from langchain_core.messages import SystemMessage, AIMessage, HumanMessage
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, START, END

from app.agent.state import (
    AgentState,
    BasicExtraction,
    InvoiceData,
    NewClientDetails,
    SYSTEM_PROMPT,
    validate_abn,
)
from app.agent.llm import get_llm
from app.database import get_supabase
from app.schemas import schemas
from app.crud import crud

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# HELPER — format today's date once per call
# ---------------------------------------------------------------------------

def _today() -> str:
    return date.today().isoformat()


# ---------------------------------------------------------------------------
# NODE 1: extract_basics
# Extracts only client_name, items, date/due_date — NO client type judgement.
# ---------------------------------------------------------------------------

def extract_basics(state: AgentState):
    """
    First extraction pass. Uses the lightweight BasicExtraction schema so the
    LLM never guesses whether a client is new — that is determined by check_client_db.
    """
    messages = state["messages"]
    today = _today()

    # Merge any already-extracted data back into context so follow-up answers
    # (e.g. "the amount is $500") are layered on top of earlier turns.
    existing: Optional[InvoiceData] = state.get("extracted_data")

    try:
        llm = get_llm()
        structured_llm = llm.with_structured_output(BasicExtraction)

        system_prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"Today's date is {today}.\n\n"
            "Your current task: Extract all available details from the conversation.\n"
            "Extract: client name, line items (description + amount), date of service, due date,\n"
            "AND any client registration details the user provides (Business Name, Contact Name, ABN, Email).\n\n"
            "Rules:\n"
            "- If the user provides quantity × rate (e.g. '40 hours at $100/hour'), "
            "calculate the total (40 × 100 = 4000) and set quantity and unit_price.\n"
            "- For relative due dates like 'due in 30 days', calculate the actual date "
            f"from today ({today}) and output as YYYY-MM-DD.\n"
            f"- If the user does not mention a date of service, default to today ({today}).\n"
            "- If the user provides a Business Name, Contact Name, ABN, and/or Email, "
            "capture them in new_client_details — even if the client might already exist.\n"
            "- If the user gives just an ABN without other client details, set it in the 'abn' field.\n"
            "- Do NOT set is_new_client — that is determined by the database lookup.\n"
            "- If any field is missing, leave it as null."
        )

        extracted: BasicExtraction = structured_llm.invoke(
            [SystemMessage(content=system_prompt)] + messages
        )

        # --- Merge extracted data with prior-turn state ---
        # Strategy: prefer fresh extraction; fall back to prior value if not found this turn.
        # This ensures client details provided in any turn are preserved.

        # Merge new_client_details: combine field-by-field so partial updates accumulate
        prior_details = existing.new_client_details if existing else None
        fresh_details = extracted.new_client_details
        if fresh_details and prior_details:
            merged_details = type(prior_details)(
                business_name=fresh_details.business_name or prior_details.business_name,
                contact_name=fresh_details.contact_name or prior_details.contact_name,
                abn=fresh_details.abn or prior_details.abn,
                email=fresh_details.email or prior_details.email,
            )
        elif fresh_details:
            merged_details = fresh_details
        else:
            merged_details = prior_details

        merged = InvoiceData(
            client_name=extracted.client_name or (existing.client_name if existing else None),
            is_new_client=existing.is_new_client if existing else None,
            new_client_details=merged_details,
            items=extracted.items or (existing.items if existing else None),
            date=extracted.date or (existing.date if existing else None),
            due_date=extracted.due_date or (existing.due_date if existing else None),
            # Prefer freshly extracted standalone ABN; fall back to prior
            abn=extracted.abn or (existing.abn if existing else None),
        )

        return {"extracted_data": merged}

    except Exception as e:
        logger.error(f"extract_basics failed: {e}")
        return {
            "extracted_data": existing,
            "messages": [AIMessage(content="I'm having trouble processing that. Could you rephrase?")],
        }


# ---------------------------------------------------------------------------
# NODE 2: check_client_db
# Real DB lookup — sets client_status and resolved_client_id.
# ---------------------------------------------------------------------------

def check_client_db(state: AgentState):
    """
    Queries Supabase for the client name extracted in the previous step.
    Sets client_status to 'existing' or 'not_found'.
    """
    data: Optional[InvoiceData] = state.get("extracted_data")

    if not data or not data.client_name:
        # No client name yet — ask for it
        msg = AIMessage(content="To get started, could you tell me which client you'd like to invoice?")
        return {"messages": [msg], "client_status": None}

    # If we already resolved the client in a previous turn, skip the DB call
    if state.get("client_status") in ("existing", "not_found"):
        return {}

    try:
        owner_id = 1  # MVP: no auth yet
        sb = get_supabase()
        result = (
            sb.table("clients")
            .select("id, name, abn")
            .ilike("name", data.client_name)   # case-insensitive match
            .eq("owner_id", owner_id)
            .execute()
        )

        if result.data:
            client = result.data[0]
            return {
                "client_status": "existing",
                "resolved_client_id": client["id"],
            }
        else:
            return {"client_status": "not_found"}

    except Exception as e:
        logger.error(f"check_client_db failed: {e}")
        return {"client_status": "not_found"}


# ---------------------------------------------------------------------------
# NODE 3: ask_creation_preference
# Presents the two-option message when a client is not found.
# ---------------------------------------------------------------------------

def ask_creation_preference(state: AgentState):
    """
    Informs the user that the client wasn't found and asks what they'd like to do.
    The CHOICES: marker is stripped by the SSE endpoint and sent as a separate
    `choices` event so the frontend can render clickable buttons.
    """
    client_name = state["extracted_data"].client_name or "this client"
    msg = AIMessage(
        content=(
            f"I don't have {client_name} in your client list. How would you like to proceed?\n\n"
            f"1. Create {client_name} as a new client first, then create the invoice\n"
            f"2. Just create the invoice for now — I'll still need their ABN\n\n"
            f"CHOICES:[\"1. Create as new client\",\"2. Invoice only (ABN required)\"]"
        )
    )
    return {"messages": [msg], "is_complete": False}


# ---------------------------------------------------------------------------
# NODE 4: resolve_creation_preference
# Parses the user's "1 or 2" reply into creation_preference.
# ---------------------------------------------------------------------------

class _PreferenceSchema(BaseModel):
    preference: str = Field(description="'full' if the user wants to create a full client profile first, 'quick' if they just want to create the invoice with minimal details")

def resolve_creation_preference(state: AgentState):
    """
    Uses a tiny structured LLM call to parse the user's preference reply
    into 'full' or 'quick'.
    """
    # If preference was already recovered from message history, skip re-parsing
    existing_pref = state.get("creation_preference")
    if existing_pref in ("full", "quick"):
        return {"creation_preference": existing_pref}

    messages = state["messages"]
    last_msg = messages[-1] if messages else None

    # Fast-path: parse common single-character answers without an LLM call
    if last_msg and isinstance(last_msg, HumanMessage):
        text = last_msg.content.strip().lower()
        if text in ("1", "option 1", "create client", "full", "yes create client"):
            return {"creation_preference": "full"}
        if text in ("2", "option 2", "just invoice", "quick", "invoice only"):
            return {"creation_preference": "quick"}

    # Fallback: ask LLM to interpret
    try:
        llm = get_llm()
        structured_llm = llm.with_structured_output(_PreferenceSchema)
        client_name = state["extracted_data"].client_name or "the client"
        prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"The user was asked whether they want to:\n"
            f"1. Create {client_name} as a full new client (with ABN, contact, email) then invoice them, OR\n"
            f"2. Skip creating the client and just create a quick invoice (ABN still required).\n\n"
            "Classify their reply as 'full' or 'quick'."
        )
        result: _PreferenceSchema = structured_llm.invoke(
            [SystemMessage(content=prompt)] + messages
        )
        return {"creation_preference": result.preference}
    except Exception as e:
        logger.error(f"resolve_creation_preference failed: {e}")
        # Default to full profile on error
        return {"creation_preference": "full"}


# ---------------------------------------------------------------------------
# NODE 5a: validate_existing_client
# Only checks invoice fields — no client registration fields needed.
# ---------------------------------------------------------------------------

def validate_existing_client(state: AgentState):
    """
    Called when the client already exists in the DB.
    Validates ONLY: line items (description + amount) and date of service.
    """
    data: Optional[InvoiceData] = state.get("extracted_data")
    missing = []

    if not data:
        missing = ["Service items (description and amount)"]
    else:
        if not data.items or not any(i.description and i.amount for i in data.items):
            missing.append("Service items (description and amount)")
        if not data.date:
            data.date = _today()  # default silently

    if missing:
        return _ask_for_missing(data, missing, state)

    return {"is_complete": True}


# ---------------------------------------------------------------------------
# NODE 5b: validate_new_client_full
# Checks invoice fields + full new client profile (ABN, contact, email).
# ---------------------------------------------------------------------------

def validate_new_client_full(state: AgentState):
    """
    Called when client is not in DB and user chose option 1 (full client profile).
    Validates: items, date + business_name, contact_name, ABN, email.
    """
    data: Optional[InvoiceData] = state.get("extracted_data")
    missing = []

    if not data:
        missing = ["Service items (description and amount)", "Business Name", "ABN", "Contact Name", "Email"]
    else:
        # Invoice fields
        if not data.items or not any(i.description and i.amount for i in data.items):
            missing.append("Service items (description and amount)")
        if not data.date:
            data.date = _today()

        # Mark as new client so generate_invoice creates the record
        data.is_new_client = True

        # Client registration fields
        details = data.new_client_details
        if not details:
            missing.extend(["Business Name", "Contact Name", "ABN", "Email"])
        else:
            if not details.business_name:
                missing.append("Business Name")
            if not details.contact_name:
                missing.append("Contact Name")
            if not details.abn:
                missing.append("ABN")
            elif not validate_abn(details.abn):
                missing.append(
                    f"A valid ABN ('{details.abn}' is not valid — must be exactly 11 digits, e.g. 51 824 753 556)"
                )
            else:
                details.abn = validate_abn(details.abn)
            if not details.email:
                missing.append("Email")

    if missing:
        return _ask_for_missing(data, missing, state)

    return {"is_complete": True}


# ---------------------------------------------------------------------------
# NODE 5c: validate_quick_invoice
# Checks invoice fields + ABN only (no full client profile).
# ---------------------------------------------------------------------------

def validate_quick_invoice(state: AgentState):
    """
    Called when client is not in DB and user chose option 2 (quick invoice).
    Validates: items, date + ABN (mandatory for ATO compliance).
    Does NOT ask for Business Name, Contact Name, or Email.
    """
    data: Optional[InvoiceData] = state.get("extracted_data")
    missing = []

    if not data:
        # Nothing extracted yet — ask only for items and ABN
        msg = AIMessage(
            content=(
                "To create a quick invoice I just need:\n\n"
                "1. The services/items and their amounts\n"
                "2. The client's ABN (required for ATO-compliant invoices)\n\n"
                "Could you provide those?"
            )
        )
        return {"messages": [msg], "is_complete": False}

    if not data.items or not any(i.description and i.amount for i in data.items):
        missing.append("service items (description and amount)")

    if not data.date:
        data.date = _today()

    # Mark as new client (no full profile) so generate_invoice creates a minimal record
    data.is_new_client = True

    # ABN can arrive in data.abn OR inside data.new_client_details.abn —
    # normalise to data.abn first so the rest of the code is consistent.
    resolved_abn = (
        data.abn
        or (data.new_client_details.abn if data.new_client_details else None)
    )
    if not resolved_abn:
        missing.append("ABN")
    elif not validate_abn(resolved_abn):
        missing.append(
            f"a valid ABN ('{resolved_abn}' is not valid — must be exactly 11 digits, e.g. 51 824 753 556)"
        )
    else:
        data.abn = validate_abn(resolved_abn)

    if missing:
        # Build a direct, specific message — do NOT call _ask_for_missing which
        # may confuse the generic LLM prompt into asking for client-profile fields.
        missing_txt = " and ".join(missing)
        msg = AIMessage(
            content=(
                f"Almost there! I just need the {missing_txt} to complete this invoice.\n\n"
                "No other client details are needed for a quick invoice."
            )
        )
        return {"messages": [msg], "is_complete": False, "extracted_data": data}

    return {"is_complete": True, "extracted_data": data}


# ---------------------------------------------------------------------------
# SHARED HELPER — ask LLM to phrase missing-fields question
# ---------------------------------------------------------------------------

def _ask_for_missing(data, missing: list, state: AgentState):
    try:
        llm = get_llm()
        ask_prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"Your current task: Ask the user for missing invoice details.\n"
            f"Extracted so far: {data.model_dump() if data else 'Nothing yet'}.\n"
            f"Still needed: {', '.join(missing)}.\n"
            "Write a short, friendly message asking for the missing information."
        )
        ai_msg = llm.invoke([SystemMessage(content=ask_prompt)])
        return {"messages": [ai_msg], "is_complete": False}
    except Exception as e:
        logger.error(f"_ask_for_missing failed: {e}")
        fallback = AIMessage(
            content=f"I still need the following details: {', '.join(missing)}. Could you provide them?"
        )
        return {"messages": [fallback], "is_complete": False}


# ---------------------------------------------------------------------------
# NODE 6: confirm_invoice
# Displays summary and asks user to confirm before creating.
# ---------------------------------------------------------------------------

def confirm_invoice(state: AgentState):
    """
    All data is present. Summarises the invoice and asks the user to confirm.
    Handles display for all three flow paths (existing / full new / quick).
    """
    data: InvoiceData = state["extracted_data"]
    messages = state["messages"]

    # Check if the user already confirmed or declined in this turn
    last_msg = messages[-1] if messages else None
    if last_msg and isinstance(last_msg, HumanMessage):
        text = last_msg.content.lower().strip()
        if text in ("yes", "y", "confirm", "go ahead", "create it", "looks good", "correct", "yep", "sure"):
            return {"user_confirmed": True}
        if text in ("no", "n", "cancel", "stop", "nevermind", "nope", "nah", "don't", "dont"):
            cancel_msg = AIMessage(
                content=(
                    "No worries! I've cancelled the invoice. "
                    "If you'd like to start a new invoice or need anything else, just let me know."
                )
            )
            return {"messages": [cancel_msg], "user_confirmed": False, "user_declined": True}

    # Build totals
    total = sum(item.amount for item in data.items if item.amount) if data.items else 0
    gst = total * 0.10
    total_inc_gst = total + gst

    lines = []
    for item in data.items or []:
        if not (item.description and item.amount):
            continue
        if item.quantity and item.unit_price:
            lines.append(f"  • {item.description}: {item.quantity} × ${item.unit_price:,.2f} = ${item.amount:,.2f}")
        else:
            lines.append(f"  • {item.description}: ${item.amount:,.2f}")
    items_table = "\n".join(lines)

    # Client display depends on flow path
    client_status = state.get("client_status")
    if client_status == "existing":
        client_info = data.client_name
    elif data.is_new_client and data.new_client_details:
        # Flow 2a — full new client profile
        d = data.new_client_details
        client_info = (
            f"{d.business_name or data.client_name}\n"
            f"  Contact: {d.contact_name or '—'}\n"
            f"  ABN: {d.abn or '—'}\n"
            f"  Email: {d.email or '—'}"
        )
    elif data.is_new_client and data.abn:
        # Flow 2b — quick invoice
        client_info = f"{data.client_name} (ABN: {data.abn})"
    else:
        client_info = data.client_name

    due_line = f"**Due date:** {data.due_date}\n" if data.due_date else ""

    summary = (
        f"Here's a summary of the invoice before I create it:\n\n"
        f"**Client:** {client_info}\n"
        f"**Date of service:** {data.date}\n"
        f"{due_line}"
        f"**Line items:**\n{items_table}\n\n"
        f"**Subtotal:** ${total:,.2f}\n"
        f"**GST (10%):** ${gst:,.2f}\n"
        f"**Total (inc. GST):** ${total_inc_gst:,.2f}\n\n"
        f"Shall I go ahead and create this invoice? (Yes/No)"
    )

    return {"messages": [AIMessage(content=summary)], "user_confirmed": False}


# ---------------------------------------------------------------------------
# NODE 7: generate_invoice
# Creates client (if new) and invoice in Supabase.
# ---------------------------------------------------------------------------

def generate_invoice(state: AgentState):
    """
    Final step. User confirmed. Creates the client record (if new) and then
    the invoice in Supabase.
    """
    data: InvoiceData = state["extracted_data"]
    owner_id = 1  # MVP: no auth yet
    creation_preference = state.get("creation_preference")

    total = sum(item.amount for item in data.items if item.amount) if data.items else 0

    try:
        sb = get_supabase()

        # --- Resolve client_id ---
        client_id = state.get("resolved_client_id")

        if client_id:
            # Existing client — update ABN if missing and user provided one
            abn_to_update = (
                (data.new_client_details and data.new_client_details.abn)
                or data.abn
            )
            if abn_to_update:
                existing = sb.table("clients").select("abn").eq("id", client_id).execute()
                if existing.data and not existing.data[0].get("abn"):
                    formatted = validate_abn(abn_to_update)
                    if formatted:
                        crud.update_client(
                            sb,
                            client_id,
                            schemas.ClientUpdate(abn=formatted),
                            owner_id,
                        )

        elif creation_preference == "full" and data.new_client_details:
            # Flow 2a: create full client profile.
            # 'name' is the primary searchable field — use business_name so that
            # future DB lookups (which search by client_name) find this record.
            # Contact name is stored in the 'role' field (closest available column).
            details = data.new_client_details
            formatted_abn = validate_abn(details.abn) if details.abn else None
            new_client = crud.create_client(
                sb,
                schemas.ClientCreate(
                    name=details.business_name or data.client_name,
                    company=details.business_name,
                    abn=formatted_abn,
                    email=details.email,
                    role=details.contact_name,   # stored in 'role' as a proxy for contact name
                ),
                owner_id,
            )
            client_id = new_client["id"]

        elif creation_preference == "quick":
            # Flow 2b: minimal client record (name + ABN)
            formatted_abn = validate_abn(data.abn) if data.abn else None
            new_client = crud.create_client(
                sb,
                schemas.ClientCreate(
                    name=data.client_name,
                    company=data.client_name,
                    abn=formatted_abn,
                ),
                owner_id,
            )
            client_id = new_client["id"]

        else:
            # Fallback: name-only client
            new_client = crud.create_client(
                sb,
                schemas.ClientCreate(name=data.client_name),
                owner_id,
            )
            client_id = new_client["id"]

        # --- Build invoice items ---
        invoice_items = []
        for item in data.items:
            if not (item.description or item.amount):
                continue
            qty = item.quantity or 1
            unit_price = item.unit_price or item.amount or 0
            invoice_items.append(
                schemas.InvoiceItemCreate(
                    description=item.description or "Service",
                    quantity=qty,
                    unit_price=unit_price,
                    tax_rate=0.10,
                )
            )

        # --- Create invoice ---
        inv_number = f"INV-{uuid.uuid4().hex[:8].upper()}"

        due_date = None
        if data.due_date:
            try:
                due_date = datetime.fromisoformat(data.due_date)
            except ValueError:
                pass

        invoice_data = schemas.InvoiceCreate(
            invoice_number=inv_number,
            client_id=client_id,
            due_date=due_date,
            status="Draft",
            notes=f"Service date: {data.date}" if data.date else None,
            items=invoice_items,
        )

        new_invoice = crud.create_invoice(sb, invoice_data, owner_id)
        invoice_id = new_invoice["id"]

        success_msg = AIMessage(
            content=(
                f"Done! I've created invoice **{inv_number}** "
                f"for **{data.client_name}** — ${total:,.2f} (+ ${total * 0.10:,.2f} GST). "
                f"The invoice has been saved as a **Draft**. "
                f"You can view and edit it from the Invoices page."
            )
        )
        return {"messages": [success_msg], "created_invoice_id": invoice_id}

    except Exception as e:
        logger.error(f"generate_invoice failed: {e}")
        error_msg = AIMessage(
            content=(
                f"I have all the details for {data.client_name} (${total:,.2f}), "
                f"but I encountered an error saving the invoice. Please try again."
            )
        )
        return {"messages": [error_msg]}


# ---------------------------------------------------------------------------
# ROUTING FUNCTIONS
# ---------------------------------------------------------------------------

def route_after_db_check(state: AgentState):
    """
    After check_client_db:
    - existing  → validate_existing_client
    - not_found and preference prompt already sent → resolve_creation_preference
    - not_found and preference prompt not yet sent → ask_creation_preference
    - None (no client name extracted) → END (wait for user)
    """
    status = state.get("client_status")
    if status == "existing":
        return "validate_existing_client"
    if status == "not_found":
        # Detect whether the preference prompt was already sent in a prior turn.
        # We look for the CHOICES: marker — format-independent and won't break
        # if the visible message text is later edited.
        messages = state.get("messages", [])
        for msg in reversed(messages):
            if isinstance(msg, AIMessage) and "How would you like to proceed?" in msg.content:
                return "resolve_creation_preference"
        return "ask_creation_preference"
    return END


def route_after_preference(state: AgentState):
    """
    After resolve_creation_preference:
    - full  → validate_new_client_full
    - quick → validate_quick_invoice
    - else  → END (wait for user)
    """
    pref = state.get("creation_preference")
    if pref == "full":
        return "validate_new_client_full"
    if pref == "quick":
        return "validate_quick_invoice"
    return END


def route_after_validation(state: AgentState):
    """
    After any validate_* node:
    - is_complete → confirm_invoice
    - else        → END (wait for user)
    """
    if state.get("is_complete", False):
        return "confirm_invoice"
    return END


def route_after_confirmation(state: AgentState):
    """
    After confirm_invoice:
    - user_confirmed → generate_invoice
    - else           → END (wait for user)
    """
    if state.get("user_confirmed", False):
        return "generate_invoice"
    return END


# ---------------------------------------------------------------------------
# BUILD THE GRAPH
# ---------------------------------------------------------------------------

workflow = StateGraph(AgentState)

# Nodes
workflow.add_node("extract_basics", extract_basics)
workflow.add_node("check_client_db", check_client_db)
workflow.add_node("ask_creation_preference", ask_creation_preference)
workflow.add_node("resolve_creation_preference", resolve_creation_preference)
workflow.add_node("validate_existing_client", validate_existing_client)
workflow.add_node("validate_new_client_full", validate_new_client_full)
workflow.add_node("validate_quick_invoice", validate_quick_invoice)
workflow.add_node("confirm_invoice", confirm_invoice)
workflow.add_node("generate_invoice", generate_invoice)

# Entry
workflow.add_edge(START, "extract_basics")
workflow.add_edge("extract_basics", "check_client_db")

# DB check → branch on client_status
workflow.add_conditional_edges("check_client_db", route_after_db_check)

# Not-found path: ask preference → resolve → branch on creation_preference
workflow.add_edge("ask_creation_preference", END)           # pause, wait for user reply
workflow.add_conditional_edges("resolve_creation_preference", route_after_preference)

# Validation → confirm
workflow.add_conditional_edges("validate_existing_client", route_after_validation)
workflow.add_conditional_edges("validate_new_client_full", route_after_validation)
workflow.add_conditional_edges("validate_quick_invoice", route_after_validation)

# Confirm → generate
workflow.add_conditional_edges("confirm_invoice", route_after_confirmation)
workflow.add_edge("generate_invoice", END)

# Compile
app = workflow.compile()
