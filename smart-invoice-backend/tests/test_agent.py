import pytest
from langchain_core.messages import HumanMessage
from app.agent.state import AgentState
from app.agent.graph import app as workflow_app

def test_missing_data_extraction_loop():
    """
    Test that if we only provide partial data, the agent sets is_complete=False
    and asks for the remaining information.
    """
    initial_messages = [
        HumanMessage(content="I cleaned the windows for $150 today.")
        # Missing: client name
    ]
    
    initial_state = AgentState(
        messages=initial_messages,
        extracted_data=None,
        is_complete=False
    )
    
    # Run graph
    result = workflow_app.invoke(initial_state)
    
    # Assertions
    assert result["is_complete"] is False
    assert result["extracted_data"]["client_name"] is None
    assert "client" in result["messages"][-1].content.lower()

def test_complete_data_extraction():
    """
    Test that if we provide all required data, the agent transitions to generate_invoice.
    """
    initial_messages = [
        HumanMessage(content="I cleaned the windows for $150 today for Bob.")
    ]
    
    initial_state = AgentState(
        messages=initial_messages,
        extracted_data=None,
        is_complete=False
    )
    
    # Run graph
    result = workflow_app.invoke(initial_state)
    
    # Assertions
    assert result["is_complete"] is True
    assert result["extracted_data"]["client_name"] == "Bob"
    assert result["extracted_data"]["amount"] == 150
    assert "generating the invoice" in result["messages"][-1].content.lower()
