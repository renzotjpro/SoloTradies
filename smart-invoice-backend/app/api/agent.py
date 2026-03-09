import asyncio
import json
import logging
import re

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from supabase import Client as SupabaseClient
from typing import List, Optional

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.agent.state import AgentState, InvoiceData, SYSTEM_PROMPT
from app.agent.graph import app as workflow_app
from app.agent.llm import get_llm
from app.auth import get_current_user
from app.database import get_supabase
from app.crud import crud

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Agent Chat"])

MAX_MESSAGES_FOR_LLM = 20


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
    """Transform backend InvoiceData into the flat shape the frontend expects.
    Returns None when there's no meaningful invoice data to display."""
    if not extracted:
        return None
    # Don't show the draft card if we have no client and no items
    items = extracted.items or []
    has_items = any(i.description or i.amount for i in items)
    if not extracted.client_name and not has_items:
        return None
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
    conversation_id: Optional[str] = None

class ImprovePromptRequest(BaseModel):
    prompt: str

class ImprovePromptResponse(BaseModel):
    improved_prompt: str


def _serialize_agent_state(final_state: dict) -> dict:
    """Extract non-message fields from AgentState for JSONB storage."""
    extracted = final_state.get("extracted_data")
    return {
        "client_status": final_state.get("client_status"),
        "resolved_client_id": final_state.get("resolved_client_id"),
        "creation_preference": final_state.get("creation_preference"),
        "is_complete": final_state.get("is_complete", False),
        "user_confirmed": final_state.get("user_confirmed", False),
        "user_declined": final_state.get("user_declined", False),
        "created_invoice_id": final_state.get("created_invoice_id"),
        "extracted_data": extracted.model_dump() if extracted and hasattr(extracted, "model_dump") else None,
    }


def _load_conversation_state(sb, conversation_id: str, owner_id: str, new_user_content: str):
    """Load conversation from DB, append new user message, build LangChain messages and initial state.

    Returns (conversation, langchain_messages, initial_state_overrides) or raises ValueError.
    """
    conv = crud.get_conversation(sb, conversation_id, owner_id)
    if not conv:
        raise ValueError("Conversation not found")

    # Persist the new user message
    crud.add_message(sb, conversation_id, "user", new_user_content)

    # Load all messages, but only send last N to the LLM
    db_messages = crud.get_messages(sb, conversation_id)
    langchain_messages = []
    for m in db_messages[-MAX_MESSAGES_FOR_LLM:]:
        if m["role"] == "user":
            langchain_messages.append(HumanMessage(content=m["content"]))
        elif m["role"] == "assistant":
            langchain_messages.append(AIMessage(content=m["content"]))

    # Restore agent state from JSONB (no more fragile text scanning)
    saved = conv.get("agent_state") or {}
    return conv, langchain_messages, {
        "client_status": saved.get("client_status"),
        "creation_preference": saved.get("creation_preference"),
        "is_complete": saved.get("is_complete", False),
        "user_declined": saved.get("user_declined", False),
    }


def _create_new_conversation(sb, owner_id: str, first_message: str):
    """Create a new conversation and persist the first user message."""
    title = first_message[:60].strip()
    if len(first_message) > 60:
        title += "..."
    conv = crud.create_conversation(sb, owner_id, title=title)
    crud.add_message(sb, conv["id"], "user", first_message)
    return conv


def _persist_ai_response(sb, conversation_id: str, owner_id: str, reply: str,
                         metadata: dict, final_state: dict):
    """Save AI response message and updated agent state to DB."""
    crud.add_message(sb, conversation_id, "assistant", reply, metadata=metadata)
    crud.update_conversation(sb, conversation_id, owner_id, {
        "agent_state": _serialize_agent_state(final_state),
    })


@router.post("/")
async def chat_endpoint(
    request: ChatRequest,
    owner_id: str = Depends(get_current_user),
    sb: SupabaseClient = Depends(get_supabase),
):
    conversation_id = request.conversation_id

    # --- Load or create conversation ---
    if conversation_id:
        try:
            conv, langchain_messages, restored = _load_conversation_state(
                sb, conversation_id, owner_id, request.messages[-1].content
            )
        except ValueError:
            return {"reply": "Conversation not found.", "choices": None,
                    "structuredData": None, "is_complete": False, "conversationId": None}
    else:
        # New conversation
        user_content = request.messages[-1].content if request.messages else ""
        conv = _create_new_conversation(sb, owner_id, user_content)
        conversation_id = conv["id"]
        langchain_messages = _build_langchain_messages(request.messages)
        restored = _recover_state(langchain_messages)

    # If the user already declined, don't re-invoke the graph
    if restored.get("user_declined"):
        cancel_reply = "No worries! If you'd like to start a new invoice or need anything else, just let me know."
        _persist_ai_response(sb, conversation_id, owner_id, cancel_reply, None, {
            "user_declined": True, "is_complete": False,
        })
        return {
            "reply": cancel_reply, "choices": None, "structuredData": None,
            "is_complete": False, "conversationId": conversation_id,
        }

    initial_state = AgentState(
        messages=langchain_messages,
        owner_id=owner_id,
        extracted_data=None,
        client_status=restored.get("client_status"),
        resolved_client_id=None,
        creation_preference=restored.get("creation_preference"),
        is_complete=restored.get("is_complete", False) or restored.get("reached_confirmation", False),
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
            "structuredData": None, "is_complete": False, "conversationId": conversation_id,
        }

    # The last message in the state is the AI's reply
    raw_reply = final_state["messages"][-1].content
    reply, choices = _extract_choices(raw_reply)
    structured_data = _format_structured_data(final_state.get("extracted_data"))
    created_invoice_id = final_state.get("created_invoice_id")

    # Persist AI response
    msg_metadata = {}
    if choices:
        msg_metadata["choices"] = choices
    if structured_data:
        msg_metadata["structuredData"] = structured_data
    if created_invoice_id:
        msg_metadata["createdInvoiceId"] = created_invoice_id
    _persist_ai_response(sb, conversation_id, owner_id, reply,
                         msg_metadata or None, final_state)

    return {
        "reply": reply,
        "choices": choices,
        "structuredData": structured_data,
        "is_complete": final_state.get("is_complete", False),
        "createdInvoiceId": created_invoice_id,
        "conversationId": conversation_id,
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
async def chat_stream_endpoint(
    request: ChatRequest,
    owner_id: str = Depends(get_current_user),
    sb: SupabaseClient = Depends(get_supabase),
):
    """SSE streaming endpoint — streams the AI reply token-by-token."""
    conversation_id = request.conversation_id

    # --- Load or create conversation ---
    if conversation_id:
        try:
            conv, langchain_messages, restored = _load_conversation_state(
                sb, conversation_id, owner_id, request.messages[-1].content
            )
        except ValueError:
            async def not_found_gen():
                yield f"data: {json.dumps({'type': 'token', 'content': 'Conversation not found.'})}\n\n"
                yield f"data: {json.dumps({'type': 'done', 'is_complete': False})}\n\n"
            return StreamingResponse(not_found_gen(), media_type="text/event-stream",
                                     headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"})
    else:
        user_content = request.messages[-1].content if request.messages else ""
        conv = _create_new_conversation(sb, owner_id, user_content)
        conversation_id = conv["id"]
        langchain_messages = _build_langchain_messages(request.messages)
        restored = _recover_state(langchain_messages)

    # If the user already declined, don't re-invoke the graph
    if restored.get("user_declined"):
        cancel_reply = "No worries! If you'd like to start a new invoice or need anything else, just let me know."

        async def cancel_generator():
            words = cancel_reply.split(" ")
            for i, word in enumerate(words):
                token = word + (" " if i < len(words) - 1 else "")
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                await asyncio.sleep(0.03)
            _persist_ai_response(sb, conversation_id, owner_id, cancel_reply, None, {
                "user_declined": True, "is_complete": False,
            })
            yield f"data: {json.dumps({'type': 'done', 'is_complete': False, 'conversationId': conversation_id})}\n\n"

        return StreamingResponse(
            cancel_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
        )

    initial_state = AgentState(
        messages=langchain_messages,
        owner_id=owner_id,
        extracted_data=None,
        client_status=restored.get("client_status"),
        resolved_client_id=None,
        creation_preference=restored.get("creation_preference"),
        is_complete=restored.get("is_complete", False) or restored.get("reached_confirmation", False),
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
            yield f"data: {json.dumps({'type': 'done', 'is_complete': False, 'conversationId': conversation_id})}\n\n"

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

    # Build metadata for DB persistence
    msg_metadata = {}
    if choices:
        msg_metadata["choices"] = choices
    if structured_data:
        msg_metadata["structuredData"] = structured_data
    if created_invoice_id:
        msg_metadata["createdInvoiceId"] = created_invoice_id

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

        # Persist AI response to DB
        _persist_ai_response(sb, conversation_id, owner_id, reply,
                             msg_metadata or None, final_state)

        # Signal completion with conversationId
        yield f"data: {json.dumps({'type': 'done', 'is_complete': is_complete, 'createdInvoiceId': created_invoice_id, 'conversationId': conversation_id})}\n\n"

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
