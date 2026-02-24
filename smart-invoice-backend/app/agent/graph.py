import logging

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langgraph.graph import StateGraph, START, END

from app.agent.state import AgentState, InvoiceData
from app.agent.llm import get_llm

logger = logging.getLogger(__name__)

def extract_information(state: AgentState):
    """
    Node: Analyzes the conversation history and attempts to extract
    client_name, service_description, amount, and date.
    """
    messages = state["messages"]

    try:
        llm = get_llm()
        structured_llm = llm.with_structured_output(InvoiceData)

        system_prompt = (
            "You are an AI assistant for a tradie invoicing application. "
            "Your job is to extract the following information from the conversation: "
            "Client name, description of service, total amount charged, and the date the service was completed. "
            "If a piece of information is missing, leave it as null/None."
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
        missing = ["client_name", "service_description", "amount", "date"]
    else:
        missing = []
        # Check our Pydantic model for nulls
        if not data.client_name: missing.append("Client name")
        if not data.service_description: missing.append("Service description")
        if not data.amount: missing.append("Total amount")
        if not data.date: missing.append("Date of service")

    if missing:
        # We need to ask the user for the missing fields
        try:
            llm = get_llm()
            ask_prompt = (
                f"You are a helpful assistant helping a tradie draft an invoice. "
                f"You have extracted the following so far: {data.dict() if data else 'Nothing yet'}. "
                f"However, you still need to ask the user for: {', '.join(missing)}. "
                f"Write a short, friendly message asking the user for this missing information."
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
    In a real system, this would trigger the PDF generation and database save.
    For the agent logic, we just return a success message summarizing the data.
    """
    data = state["extracted_data"]
    
    # In reality, this is where we'd call crud.create_invoice and the PDF generation script
    # For now, we return a final confirmation message.
    
    success_msg = AIMessage(
        content=f"Great! I have all the details. I am generating the invoice for {data.client_name} for the amount of ${data.amount}."
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
