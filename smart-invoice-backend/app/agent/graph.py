import logging
import uuid

from langchain_core.messages import SystemMessage, AIMessage
from langgraph.graph import StateGraph, START, END

from app.agent.state import AgentState, InvoiceData, SYSTEM_PROMPT
from app.agent.llm import get_llm
from app.database import get_supabase
from app.schemas import schemas
from app.crud import crud

logger = logging.getLogger(__name__)

def extract_information(state: AgentState):
    """
    Node: Analyzes the conversation history and attempts to extract
    client_name, line items (service descriptions + amounts), and date.
    """
    messages = state["messages"]

    try:
        llm = get_llm()
        structured_llm = llm.with_structured_output(InvoiceData)

        system_prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            "Your current task: Extract structured invoice data from the conversation.\n"
            "Extract: client name, one or more line items (each with description and amount), "
            "and date of service. If any piece is missing, leave it as null/None."
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
    If anything is missing, sets is_complete=False and generates a reply asking for it.
    If everything is present, sets is_complete=True.
    """
    data = state.get("extracted_data")
    
    # If no data object exists yet, we assume missing info
    if not data:
        missing = ["Client name", "Service items (description and amount)", "Date of service"]
    else:
        missing = []
        if not data.client_name: missing.append("Client name")
        if not data.items or not any(i.description and i.amount for i in data.items):
            missing.append("Service items (description and amount)")
        if not data.date: missing.append("Date of service")

    if missing:
        # We need to ask the user for the missing fields
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

def generate_invoice(state: AgentState):
    """
    Node: The final step. All data is present.
    Creates the client (if new) and invoice in Supabase, then returns a confirmation.
    """
    data = state["extracted_data"]
    owner_id = 1  # MVP: no auth yet

    total = sum(item.amount for item in data.items if item.amount) if data.items else 0

    try:
        sb = get_supabase()

        # Find or create the client
        existing = sb.table("clients").select("id").eq("name", data.client_name).eq("owner_id", owner_id).execute()
        if existing.data:
            client_id = existing.data[0]["id"]
        else:
            new_client = crud.create_client(
                sb,
                schemas.ClientCreate(name=data.client_name),
                owner_id,
            )
            client_id = new_client["id"]

        # Build invoice items in the schema the CRUD layer expects
        invoice_items = [
            schemas.InvoiceItemCreate(
                description=item.description or "Service",
                quantity=1,
                unit_price=item.amount or 0,
                tax_rate=0.10,
            )
            for item in data.items
            if item.description or item.amount
        ]

        # Generate a unique invoice number
        inv_number = f"INV-{uuid.uuid4().hex[:8].upper()}"

        invoice_data = schemas.InvoiceCreate(
            invoice_number=inv_number,
            client_id=client_id,
            status="Draft",
            notes=f"Service date: {data.date}" if data.date else None,
            items=invoice_items,
        )

        new_invoice = crud.create_invoice(sb, invoice_data, owner_id)
        invoice_id = new_invoice["id"]

        success_msg = AIMessage(
            content=(
                f"Great! I have all the details. I've created invoice **{inv_number}** "
                f"for {data.client_name} for the amount of ${total:,.2f} (excl. GST). "
                f"The invoice has been saved as a Draft."
            )
        )
        return {"messages": [success_msg], "created_invoice_id": invoice_id}

    except Exception as e:
        logger.error(f"generate_invoice failed to save: {e}")
        success_msg = AIMessage(
            content=(
                f"I have all the details for {data.client_name} (${total:,.2f}), "
                f"but I encountered an error saving the invoice. Please try again."
            )
        )
        return {"messages": [success_msg]}

def route_next_step(state: AgentState):
    """
    Conditional Edge: Routes to 'generate_invoice' if all data is present,
    otherwise routes back to END (meaning we wait for the user to reply).
    """
    if state.get("is_complete", False):
        return "generate_invoice"
    return END

# --- Build the Graph ---
workflow = StateGraph(AgentState)

workflow.add_node("extract_information", extract_information)
workflow.add_node("validate_data", validate_data)
workflow.add_node("generate_invoice", generate_invoice)

workflow.add_edge(START, "extract_information")
workflow.add_edge("extract_information", "validate_data")
# Conditional routing based on the validation step
workflow.add_conditional_edges("validate_data", route_next_step)
workflow.add_edge("generate_invoice", END)

# Compile into a runnable app
app = workflow.compile()
