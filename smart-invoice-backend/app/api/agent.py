from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from langchain_core.messages import HumanMessage, AIMessage

from app.agent.state import AgentState
from app.agent.graph import app as workflow_app

router = APIRouter(prefix="/api/chat", tags=["Agent Chat"])

class ChatMessage(BaseModel):
    role: str
    content: str
   
class ChatRequest(BaseModel):
    messages: List[ChatMessage]

@router.post("/")
async def chat_endpoint(request: ChatRequest):
    # Convert incoming dicts to LangChain message objects
    langchain_messages = []
    for msg in request.messages:
        if msg.role == "user":
            langchain_messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            langchain_messages.append(AIMessage(content=msg.content))
            
    # Initialize state
    initial_state = AgentState(
        messages=langchain_messages,
        extracted_data=None, 
        is_complete=False
    )
    
    # Run the graph
    # LangGraph returns a dictionary of the updated state
    final_state = workflow_app.invoke(initial_state)
    
    # The last message in the state is the AI's reply
    reply = final_state["messages"][-1].content
    
    # Check if structured data was extracted
    structured_data = None
    if final_state.get("extracted_data"):
        structured_data = final_state["extracted_data"].dict()
        
    return {
        "reply": reply,
        "structuredData": structured_data,
        "is_complete": final_state.get("is_complete", False)
    }
