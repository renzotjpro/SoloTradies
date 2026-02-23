import asyncio
import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.agent.state import AgentState
from app.agent.graph import app as workflow_app

router = APIRouter(prefix="/api/chat", tags=["Agent Chat"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class ImprovePromptRequest(BaseModel):
    prompt: str

class ImprovePromptResponse(BaseModel):
    improved_prompt: str

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


def _build_langchain_messages(messages: List[ChatMessage]):
    """Convert incoming chat messages to LangChain message objects."""
    langchain_messages = []
    for msg in messages:
        if msg.role == "user":
            langchain_messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            langchain_messages.append(AIMessage(content=msg.content))
    return langchain_messages


@router.post("/stream")
async def chat_stream_endpoint(request: ChatRequest):
    """SSE streaming endpoint — streams the AI reply token-by-token."""
    langchain_messages = _build_langchain_messages(request.messages)

    initial_state = AgentState(
        messages=langchain_messages,
        extracted_data=None,
        is_complete=False,
    )

    # Run the graph synchronously (extraction is fast), then stream the reply
    final_state = workflow_app.invoke(initial_state)

    reply = final_state["messages"][-1].content
    structured_data = None
    if final_state.get("extracted_data"):
        structured_data = final_state["extracted_data"].dict()
    is_complete = final_state.get("is_complete", False)

    async def event_generator():
        # Stream the reply word-by-word for a ChatGPT-like feel
        words = reply.split(" ")
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
            await asyncio.sleep(0.03)

        # Send structured data if extracted
        if structured_data:
            yield f"data: {json.dumps({'type': 'structured_data', 'data': structured_data})}\n\n"

        # Signal completion
        yield f"data: {json.dumps({'type': 'done', 'is_complete': is_complete})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/improve-prompt", response_model=ImprovePromptResponse)
async def improve_prompt(request: ImprovePromptRequest):
    """Rewrite a rough user prompt into clear, professional text."""
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)
    system_msg = SystemMessage(
        content=(
            "You are an AI assistant for a tradie invoicing app. "
            "The user will provide a rough, potentially grammatically incorrect description of their work. "
            "Rewrite it into a clear, professional, and structured text that is easy to understand. "
            "Fix spelling mistakes. Return ONLY the improved text, no conversational filler."
        )
    )
    human_msg = HumanMessage(content=request.prompt)
    response = llm.invoke([system_msg, human_msg])
    return ImprovePromptResponse(improved_prompt=response.content)
