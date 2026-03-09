from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from typing import List, Optional

from app.database import get_supabase
from app.auth import get_current_user
from app.crud import crud
from app.schemas import schemas

router = APIRouter(prefix="/api/memories", tags=["Memories"])


@router.get("/", response_model=List[schemas.MemoryResponse])
def list_memories(
    category: Optional[str] = None,
    subject: Optional[str] = None,
    sb: Client = Depends(get_supabase),
    owner_id: str = Depends(get_current_user),
):
    return crud.get_memories(sb, owner_id=owner_id, category=category, subject=subject)


@router.post("/", response_model=schemas.MemoryResponse)
def upsert_memory(
    body: schemas.MemoryCreate,
    sb: Client = Depends(get_supabase),
    owner_id: str = Depends(get_current_user),
):
    result = crud.upsert_memory(
        sb, owner_id=owner_id,
        category=body.category, key=body.key, value=body.value,
        subject=body.subject, source="manual",
    )
    if not result:
        raise HTTPException(status_code=500, detail="Failed to save memory")
    return result


@router.delete("/{memory_id}")
def delete_memory(
    memory_id: str,
    sb: Client = Depends(get_supabase),
    owner_id: str = Depends(get_current_user),
):
    deleted = crud.delete_memory(sb, memory_id=memory_id, owner_id=owner_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"detail": "Memory deleted"}


@router.get("/search", response_model=List[schemas.MemoryResponse])
def search_memories(
    q: str = "",
    category: Optional[str] = None,
    sb: Client = Depends(get_supabase),
    owner_id: str = Depends(get_current_user),
):
    if not q.strip():
        return crud.get_memories(sb, owner_id=owner_id, category=category)
    return crud.search_memories(sb, owner_id=owner_id, query_text=q, category=category)
