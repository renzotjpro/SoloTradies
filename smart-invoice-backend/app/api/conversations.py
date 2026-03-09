from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from typing import List

from app.database import get_supabase
from app.auth import get_current_user
from app.crud import crud
from app.schemas import schemas

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])


@router.get("/", response_model=List[schemas.ConversationSummary])
def list_conversations(
    limit: int = 20,
    offset: int = 0,
    sb: Client = Depends(get_supabase),
    owner_id: str = Depends(get_current_user),
):
    return crud.get_conversations(sb, owner_id=owner_id, limit=limit, offset=offset)


@router.post("/", response_model=schemas.ConversationSummary)
def create_conversation(
    body: schemas.ConversationCreate,
    sb: Client = Depends(get_supabase),
    owner_id: str = Depends(get_current_user),
):
    return crud.create_conversation(sb, owner_id=owner_id, title=body.title)


@router.get("/{conversation_id}", response_model=schemas.ConversationDetail)
def get_conversation(
    conversation_id: str,
    sb: Client = Depends(get_supabase),
    owner_id: str = Depends(get_current_user),
):
    conv = crud.get_conversation(sb, conversation_id=conversation_id, owner_id=owner_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = crud.get_messages(sb, conversation_id=conversation_id)
    conv["messages"] = messages
    return conv


@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    sb: Client = Depends(get_supabase),
    owner_id: str = Depends(get_current_user),
):
    deleted = crud.delete_conversation(sb, conversation_id=conversation_id, owner_id=owner_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"detail": "Conversation deleted"}


@router.patch("/{conversation_id}/archive")
def toggle_archive(
    conversation_id: str,
    sb: Client = Depends(get_supabase),
    owner_id: str = Depends(get_current_user),
):
    conv = crud.get_conversation(sb, conversation_id=conversation_id, owner_id=owner_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    updated = crud.update_conversation(
        sb, conversation_id=conversation_id, owner_id=owner_id,
        updates={"is_archived": not conv.get("is_archived", False)},
    )
    return updated
