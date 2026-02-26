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

# --- Extraction Schema for LLM ---
class InvoiceLineItem(BaseModel):
    description: Optional[str] = Field(description="Description of this service or item")
    amount: Optional[float] = Field(description="Total amount for this line item (calculate from qty × rate if given)")
    quantity: Optional[float] = Field(default=None, description="Quantity (e.g. 40 hours)")
    unit_price: Optional[float] = Field(default=None, description="Price per unit (e.g. $100/hour)")

class NewClientDetails(BaseModel):
    business_name: Optional[str] = Field(description="The business name of the new client")
    contact_name: Optional[str] = Field(description="The contact person's name")
    abn: Optional[str] = Field(description="The Australian Business Number (ABN)")
    email: Optional[str] = Field(description="The client's email address")

class InvoiceData(BaseModel):
    client_name: Optional[str] = Field(description="The name of the client")
    is_new_client: Optional[bool] = Field(description="True if the user indicates this is a new client")
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

# --- Agent State ---
class AgentState(TypedDict):
    # The list of messages in the conversation
    messages: Annotated[List[AnyMessage], add_messages]

    # The extracted structured data so far
    extracted_data: Optional[InvoiceData]

    # Flag to indicate if we have all necessary data to generate the PDF
    is_complete: bool

    # Flag to indicate if user has confirmed the invoice summary
    user_confirmed: bool

    # ID of the invoice created in the database (set by generate_invoice)
    created_invoice_id: Optional[int]
