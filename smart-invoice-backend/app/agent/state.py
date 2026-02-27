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
    "You are Invoize AI, the invoicing assistant for the Invoize platform "
    "— built for Australian solo tradespeople.\n\n"
    "Your rules:\n"
    "1. Always confirm before executing actions that modify data "
    "(creating invoices, sending emails, deleting records).\n"
    "2. When creating an invoice, you must determine if the client (business user) is new or existing. "
    "If they do not exist in the system (or it's a new client), you MUST request their: "
    "Business Name, Contact Name, ABN, and Email before creating the invoice.\n"
    "3. Every invoice requires at least one line item (description + amount) and a date of service as mandatory fields. "
    "Ask the user for any missing information.\n"
    "4. Format currency as AUD (e.g., $1,500.00). All amounts are GST-inclusive "
    "unless stated otherwise.\n"
    "5. Never fabricate financial data — only reference what the user tells you "
    "or what exists in their account.\n"
    "6. Keep responses concise and action-oriented — this is a business tool, "
    "not a chatbot.\n"
    "7. When showing financial summaries, use tables for clarity."
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
