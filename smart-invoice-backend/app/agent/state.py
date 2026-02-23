from typing import TypedDict, Annotated, List, Optional
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field

# --- Extraction Schema for LLM ---
class InvoiceData(BaseModel):
    client_name: Optional[str] = Field(description="The name of the client")
    service_description: Optional[str] = Field(description="A description of the services rendered")
    amount: Optional[float] = Field(description="The total amount to charge the client in numbers")
    date: Optional[str] = Field(description="The date the service was completed")

# --- Agent State ---
class AgentState(TypedDict):
    # The list of messages in the conversation
    messages: Annotated[List[AnyMessage], add_messages]
    
    # The extracted structured data so far
    extracted_data: Optional[InvoiceData]
    
    # Flag to indicate if we have all necessary data to generate the PDF
    is_complete: bool
