import logging
import uuid
from datetime import date, datetime

from langchain_core.messages import SystemMessage, AIMessage, HumanMessage
from langgraph.graph import StateGraph, START, END

from app.agent.state import AgentState, InvoiceData, SYSTEM_PROMPT, validate_abn
from app.agent.llm import get_llm
from app.database import get_supabase
from app.schemas import schemas
from app.crud import crud

logger = logging.getLogger(__name__)

def extract_information(state: AgentState):
    """
    Node: Analyzes the conversation history and attempts to extract
    client_name, is_new_client, new_client_details, line items, and date.
    """
    messages = state["messages"]

    try:
        llm = get_llm()
        structured_llm = llm.with_structured_output(InvoiceData)

        today = date.today().isoformat()
        system_prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"Today's date is {today}.\n\n"
            "Your current task: Extract structured invoice data from the conversation.\n"
            "Extract: client name, whether they are a new client, line items "
            "(each with description, amount, and optionally quantity + unit_price), "
            "date of service, and due date.\n\n"
            "Important rules:\n"
            "- If the user provides quantity and rate (e.g. '40 hours at $100/hour'), "
            "calculate the total amount (40 × 100 = 4000) and set quantity and unit_price.\n"
            "- For relative due dates like 'due in 30 days', calculate the actual date "
            f"from today ({today}) and output as YYYY-MM-DD.\n"
            f"- If the user does not mention a date of service, default to today ({today}).\n"
            "- If the client is new, also extract their business name, contact name, ABN, and email.\n"
            "- If the user provides an ABN for an existing client, store it in new_client_details.abn. "
            "Extract the raw digits (e.g. '51824753556' or '51 824 753 556') — formatting is handled later.\n"
            "- If any piece is missing, leave it as null/None."
        )

        response = structured_llm.invoke([SystemMessage(content=system_prompt)] + messages)
        return {"extracted_data": response}
    except Exception as e:
        logger.error(f"extract_information failed: {e}")
        return {
            "extracted_data": None,
            "messages": [AIMessage(content="I'm having trouble processing that right now. Could you try again or rephrase your message?")],
        }

def validate_data(state: AgentState):
    """
    Node: Checks the current extracted_data.
    Validates base invoice fields + new client details (per system prompt rule #2).
    If anything is missing, sets is_complete=False and asks the user.
    If everything is present, sets is_complete=True.
    """
    data = state.get("extracted_data")

    if not data:
        missing = ["Client name", "Service items (description and amount)", "Date of service"]
    else:
        missing = []
        if not data.client_name:
            missing.append("Client name")
        if not data.items or not any(i.description and i.amount for i in data.items):
            missing.append("Service items (description and amount)")
        if not data.date:
            # Default to today if not specified
            data.date = date.today().isoformat()

        # Validate new client details per system prompt rule #2
        if data.is_new_client and data.client_name:
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
                        f"A valid ABN ('{details.abn}' is not valid "
                        "— must be exactly 11 digits, e.g. 51 824 753 556)"
                    )
                else:
                    details.abn = validate_abn(details.abn)
                if not details.email:
                    missing.append("Email")

        # Validate and format ABN if the user provided one (for existing clients only —
        # new client ABN is already validated above)
        if not data.is_new_client and data.new_client_details and data.new_client_details.abn:
            formatted = validate_abn(data.new_client_details.abn)
            if formatted:
                data.new_client_details.abn = formatted
            else:
                missing.append(
                    f"A valid ABN (the value '{data.new_client_details.abn}' is not valid "
                    "— an ABN must be exactly 11 digits, e.g. 51 824 753 556)"
                )

        # For existing clients, check if they have an ABN in the database
        if data.client_name and not data.is_new_client and not missing:
            # If the user already provided the ABN in this conversation, skip the DB check
            user_provided_abn = (
                data.new_client_details
                and data.new_client_details.abn
                and validate_abn(data.new_client_details.abn)
            )
            if not user_provided_abn:
                try:
                    owner_id = 1
                    sb = get_supabase()
                    existing = (
                        sb.table("clients")
                        .select("id, name, abn")
                        .eq("name", data.client_name)
                        .eq("owner_id", owner_id)
                        .execute()
                    )
                    if existing.data:
                        client = existing.data[0]
                        if not client.get("abn"):
                            missing.append(
                                f"ABN for {data.client_name} (this client has no ABN on file "
                                "— please provide it so I can update their record)"
                            )
                except Exception as e:
                    logger.error(f"validate_data client ABN check failed: {e}")

    if missing:
        try:
            llm = get_llm()
            ask_prompt = (
                f"{SYSTEM_PROMPT}\n\n"
                f"Your current task: Ask the user for missing invoice details.\n"
                f"Extracted so far: {data.model_dump() if data else 'Nothing yet'}.\n"
                f"Still needed: {', '.join(missing)}.\n"
                f"Write a short, friendly message asking for the missing information."
            )
            ai_msg = llm.invoke([SystemMessage(content=ask_prompt)])
            return {"messages": [ai_msg], "is_complete": False}
        except Exception as e:
            logger.error(f"validate_data failed: {e}")
            fallback = AIMessage(content=f"I still need the following details: {', '.join(missing)}. Could you provide them?")
            return {"messages": [fallback], "is_complete": False}

    return {"is_complete": True}

def confirm_invoice(state: AgentState):
    """
    Node: All data is present. Summarises the invoice and asks the user
    to confirm before creating it (system prompt rule #1).
    """
    data = state["extracted_data"]
    messages = state["messages"]

    # Check if the user already confirmed in this turn
    last_msg = messages[-1] if messages else None
    if last_msg and isinstance(last_msg, HumanMessage):
        text = last_msg.content.lower().strip()
        if text in ("yes", "y", "confirm", "go ahead", "create it", "looks good", "correct", "yep", "sure"):
            return {"user_confirmed": True}

    # Build a summary for the user to review
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

    client_info = data.client_name
    if data.is_new_client and data.new_client_details:
        d = data.new_client_details
        client_info = (
            f"{d.business_name or data.client_name}\n"
            f"  Contact: {d.contact_name or '—'}\n"
            f"  ABN: {d.abn or '—'}\n"
            f"  Email: {d.email or '—'}"
        )
    elif not data.is_new_client and data.new_client_details and data.new_client_details.abn:
        client_info = f"{data.client_name} (ABN: {data.new_client_details.abn})"

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

def generate_invoice(state: AgentState):
    """
    Node: The final step. User has confirmed.
    Creates the client (if new, using full details) and invoice in Supabase.
    """
    data = state["extracted_data"]
    owner_id = 1  # MVP: no auth yet

    total = sum(item.amount for item in data.items if item.amount) if data.items else 0

    try:
        sb = get_supabase()

        # Find or create the client
        abn_updated = False
        existing = sb.table("clients").select("id, abn").eq("name", data.client_name).eq("owner_id", owner_id).execute()
        if existing.data:
            client_id = existing.data[0]["id"]
            # Update ABN if the user provided one and the client doesn't have it
            if data.new_client_details and data.new_client_details.abn and not existing.data[0].get("abn"):
                formatted_abn = validate_abn(data.new_client_details.abn)
                if formatted_abn:
                    crud.update_client(
                        sb,
                        client_id,
                        schemas.ClientUpdate(abn=formatted_abn),
                        owner_id,
                    )
                    abn_updated = True
        else:
            # Use new client details if available, otherwise fall back to client_name
            details = data.new_client_details
            if details:
                new_client = crud.create_client(
                    sb,
                    schemas.ClientCreate(
                        name=details.contact_name or data.client_name,
                        company=details.business_name,
                        abn=details.abn,
                        email=details.email,
                    ),
                    owner_id,
                )
            else:
                new_client = crud.create_client(
                    sb,
                    schemas.ClientCreate(name=data.client_name),
                    owner_id,
                )
            client_id = new_client["id"]

        # Build invoice items — use quantity/unit_price if available
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

        # Generate a unique invoice number
        inv_number = f"INV-{uuid.uuid4().hex[:8].upper()}"

        # Parse due_date if provided
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

        abn_note = ""
        if abn_updated:
            abn_note = f" I've also updated {data.client_name}'s ABN to **{validate_abn(data.new_client_details.abn)}**."

        success_msg = AIMessage(
            content=(
                f"Done! I've created invoice **{inv_number}** "
                f"for {data.client_name} — ${total:,.2f} (+ ${total * 0.10:,.2f} GST). "
                f"The invoice has been saved as a **Draft**.{abn_note} "
                f"You can view and edit it from the Invoices page."
            )
        )
        return {"messages": [success_msg], "created_invoice_id": invoice_id}

    except Exception as e:
        logger.error(f"generate_invoice failed to save: {e}")
        error_msg = AIMessage(
            content=(
                f"I have all the details for {data.client_name} (${total:,.2f}), "
                f"but I encountered an error saving the invoice. Please try again."
            )
        )
        return {"messages": [error_msg]}

def route_after_validation(state: AgentState):
    """
    Conditional Edge after validate_data:
    Routes to confirm_invoice if all data is present, otherwise END (wait for user).
    """
    if state.get("is_complete", False):
        return "confirm_invoice"
    return END

def route_after_confirmation(state: AgentState):
    """
    Conditional Edge after confirm_invoice:
    Routes to generate_invoice if user confirmed, otherwise END (wait for user).
    """
    if state.get("user_confirmed", False):
        return "generate_invoice"
    return END

# --- Build the Graph ---
workflow = StateGraph(AgentState)

workflow.add_node("extract_information", extract_information)
workflow.add_node("validate_data", validate_data)
workflow.add_node("confirm_invoice", confirm_invoice)
workflow.add_node("generate_invoice", generate_invoice)

workflow.add_edge(START, "extract_information")
workflow.add_edge("extract_information", "validate_data")
workflow.add_conditional_edges("validate_data", route_after_validation)
workflow.add_conditional_edges("confirm_invoice", route_after_confirmation)
workflow.add_edge("generate_invoice", END)

# Compile into a runnable app
app = workflow.compile()
