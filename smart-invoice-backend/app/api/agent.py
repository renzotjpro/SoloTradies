import asyncio
import json
import logging

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.agent.state import AgentState, SYSTEM_PROMPT
from app.agent.graph import app as workflow_app
from app.agent.llm import get_llm

logger = logging.getLogger(__name__)

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
    try:
        final_state = workflow_app.invoke(initial_state)
    except Exception as e:
        logger.error(f"Chat workflow failed: {e}")
        return {
            "reply": "Sorry, something went wrong while processing your message. Please try again.",
            "structuredData": None,
            "is_complete": False,
        }

    # The last message in the state is the AI's reply
    reply = final_state["messages"][-1].content

    # Check if structured data was extracted
    structured_data = None
    if final_state.get("extracted_data"):
        structured_data = final_state["extracted_data"].model_dump()

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
    try:
        final_state = workflow_app.invoke(initial_state)
    except Exception as e:
        logger.error(f"Chat stream workflow failed: {e}")

        async def error_generator():
            yield f"data: {json.dumps({'type': 'token', 'content': 'Sorry, something went wrong. Please try again.'})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'is_complete': False})}\n\n"

        return StreamingResponse(
            error_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
        )

    reply = final_state["messages"][-1].content
    structured_data = None
    if final_state.get("extracted_data"):
        structured_data = final_state["extracted_data"].model_dump()
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
    llm = get_llm(temperature=0.3)
    system_msg = SystemMessage(
        content=(
            f"{SYSTEM_PROMPT}\n\n"
            "Your current task: Rewrite the user's rough description into clear, "
            "professional text. Fix spelling and grammar. "
            "Return ONLY the improved text, no conversational filler."
        )
    )
    human_msg = HumanMessage(content=request.prompt)
    try:
        response = llm.invoke([system_msg, human_msg])
        return ImprovePromptResponse(improved_prompt=response.content)
    except Exception as e:
        logger.error(f"Improve prompt failed: {e}")
        return ImprovePromptResponse(improved_prompt=request.prompt)
