import asyncio
import json
import logging
import re

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.agent.state import AgentState, InvoiceData, SYSTEM_PROMPT
from app.agent.graph import app as workflow_app
from app.agent.llm import get_llm

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Agent Chat"])


def _recover_state(messages) -> dict:
    """Scan message history to reconstruct state fields lost between API turns.

    Returns a dict with recovered fields: client_status, creation_preference,
    reached_confirmation, user_declined.
    """
    client_status = None
    creation_preference = None
    reached_confirmation = False
    user_declined = False

    for i, msg in enumerate(messages):
        if isinstance(msg, AIMessage) and "How would you like to proceed?" in msg.content:
            client_status = "not_found"
            # Check if the next message is a user preference reply
            if i + 1 < len(messages) and isinstance(messages[i + 1], HumanMessage):
                text = messages[i + 1].content.strip().lower()
                if text in ("1", "option 1", "create client", "full", "yes create client"):
                    creation_preference = "full"
                elif text in ("2", "option 2", "just invoice", "quick", "invoice only"):
                    creation_preference = "quick"

        # Detect if we reached the confirmation summary
        if isinstance(msg, AIMessage) and "Shall I go ahead and create this invoice?" in msg.content:
            reached_confirmation = True

        # Detect if invoice was already cancelled in a prior turn
        if isinstance(msg, AIMessage) and "I've cancelled the invoice" in msg.content:
            user_declined = True

    # Also detect: confirmation was the last AI message and user just replied "no"
    # This handles the current turn where "No" hasn't been processed yet
    if reached_confirmation and not user_declined and len(messages) >= 2:
        last_msg = messages[-1]
        if isinstance(last_msg, HumanMessage):
            text = last_msg.content.strip().lower()
            if text in ("no", "n", "cancel", "stop", "nevermind", "nope", "nah", "don't", "dont"):
                user_declined = True

    return {
        "client_status": client_status,
        "creation_preference": creation_preference,
        "reached_confirmation": reached_confirmation,
        "user_declined": user_declined,
    }

_CHOICES_RE = re.compile(r'CHOICES:(\[.*?\])', re.DOTALL)


def _extract_choices(text: str) -> tuple[str, Optional[list[str]]]:
    """
    Strips the CHOICES:[...] marker from the message text.
    Returns (clean_text, choices_list | None).
    """
    match = _CHOICES_RE.search(text)
    if not match:
        return text, None
    try:
        choices = json.loads(match.group(1))
    except Exception:
        choices = None
    clean = _CHOICES_RE.sub("", text).strip()
    return clean, choices


def _format_structured_data(extracted: InvoiceData | None) -> dict | None:
    """Transform backend InvoiceData into the flat shape the frontend expects."""
    if not extracted:
        return None
    items = extracted.items or []
    service = ", ".join(i.description for i in items if i.description) or None
    total = sum(i.amount for i in items if i.amount)
    return {
        "client": extracted.client_name,
        "service": service,
        "amount": f"${total:,.2f}" if total else None,
        "date": extracted.date,
    }

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
            
    # Recover state fields from message history (they are lost between API turns)
    recovered = _recover_state(langchain_messages)

    # If the user already declined, don't re-invoke the graph
    if recovered["user_declined"]:
        return {
            "reply": "No worries! If you'd like to start a new invoice or need anything else, just let me know.",
            "choices": None,
            "structuredData": None,
            "is_complete": False,
        }

    initial_state = AgentState(
        messages=langchain_messages,
        extracted_data=None,
        client_status=recovered["client_status"],
        resolved_client_id=None,
        creation_preference=recovered["creation_preference"],
        is_complete=recovered["reached_confirmation"],
        user_confirmed=False,
        user_declined=False,
        created_invoice_id=None,
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
    raw_reply = final_state["messages"][-1].content
    reply, choices = _extract_choices(raw_reply)

    return {
        "reply": reply,
        "choices": choices,
        "structuredData": _format_structured_data(final_state.get("extracted_data")),
        "is_complete": final_state.get("is_complete", False),
        "createdInvoiceId": final_state.get("created_invoice_id"),
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

    # Recover state fields from message history (they are lost between API turns)
    recovered = _recover_state(langchain_messages)

    # If the user already declined, don't re-invoke the graph
    if recovered["user_declined"]:
        cancel_reply = "No worries! If you'd like to start a new invoice or need anything else, just let me know."

        async def cancel_generator():
            words = cancel_reply.split(" ")
            for i, word in enumerate(words):
                token = word + (" " if i < len(words) - 1 else "")
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                await asyncio.sleep(0.03)
            yield f"data: {json.dumps({'type': 'done', 'is_complete': False})}\n\n"

        return StreamingResponse(
            cancel_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
        )

    initial_state = AgentState(
        messages=langchain_messages,
        extracted_data=None,
        client_status=recovered["client_status"],
        resolved_client_id=None,
        creation_preference=recovered["creation_preference"],
        is_complete=recovered["reached_confirmation"],
        user_confirmed=False,
        user_declined=False,
        created_invoice_id=None,
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

    raw_reply = final_state["messages"][-1].content
    reply, choices = _extract_choices(raw_reply)
    structured_data = _format_structured_data(final_state.get("extracted_data"))
    is_complete = final_state.get("is_complete", False)
    created_invoice_id = final_state.get("created_invoice_id")

    async def event_generator():
        # Stream the reply word-by-word for a ChatGPT-like feel
        words = reply.split(" ")
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
            await asyncio.sleep(0.03)

        # Send choices if present (so frontend can render quick-reply buttons)
        if choices:
            yield f"data: {json.dumps({'type': 'choices', 'data': choices})}\n\n"

        # Send structured data if extracted
        if structured_data:
            yield f"data: {json.dumps({'type': 'structured_data', 'data': structured_data})}\n\n"

        # Signal completion
        yield f"data: {json.dumps({'type': 'done', 'is_complete': is_complete, 'createdInvoiceId': created_invoice_id})}\n\n"

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
