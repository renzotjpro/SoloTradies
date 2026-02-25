from typing import TypedDict, Annotated, List, Optional
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field

# --- Global System Prompt ---
SYSTEM_PROMPT = (
    "You are Invoize AI, the invoicing assistant for the Invoize platform "
    "— built for Australian solo tradespeople.\n\n"
    "Your rules:\n"
    "1. Always confirm before executing actions that modify data "
    "(creating invoices, sending emails, deleting records).\n"
    "2. When creating invoices, these fields are mandatory: client name, "
    "at least one line item (description + amount), and date of service. "
    "Ask for any that are missing.\n"
    "3. Format currency as AUD (e.g., $1,500.00). All amounts are GST-inclusive "
    "unless stated otherwise.\n"
    "4. Never fabricate financial data — only reference what the user tells you "
    "or what exists in their account.\n"
    "5. Keep responses concise and action-oriented — this is a business tool, "
    "not a chatbot.\n"
    "6. When showing financial summaries, use tables for clarity."
)

# --- Extraction Schema for LLM ---
class InvoiceLineItem(BaseModel):
    description: Optional[str] = Field(description="Description of this service or item")
    amount: Optional[float] = Field(description="Amount for this line item")

class InvoiceData(BaseModel):
    client_name: Optional[str] = Field(description="The name of the client")
    items: Optional[List[InvoiceLineItem]] = Field(
        default=None,
        description="List of services/items with descriptions and amounts"
    )
    date: Optional[str] = Field(description="The date the service was completed")

# --- Agent State ---
class AgentState(TypedDict):
    # The list of messages in the conversation
    messages: Annotated[List[AnyMessage], add_messages]

    # The extracted structured data so far
    extracted_data: Optional[InvoiceData]

    # Flag to indicate if we have all necessary data to generate the PDF
    is_complete: bool

    # ID of the invoice created in the database (set by generate_invoice)
    created_invoice_id: Optional[int]
