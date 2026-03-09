from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.database import get_supabase
from app.auth import get_current_user
from app.crud import crud
from app.schemas import schemas

router = APIRouter(prefix="/organization", tags=["Organization"])

@router.get("/", response_model=schemas.Organization)
def read_organization(sb: Client = Depends(get_supabase), owner_id: str = Depends(get_current_user)):
    org = crud.get_organization(sb, owner_id=owner_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.post("/", response_model=schemas.Organization)
def create_organization(org: schemas.OrganizationCreate, sb: Client = Depends(get_supabase), owner_id: str = Depends(get_current_user)):
    existing = crud.get_organization(sb, owner_id=owner_id)
    if existing:
        raise HTTPException(status_code=409, detail="Organization already exists. Use PUT to update.")
    return crud.create_organization(sb=sb, org=org, owner_id=owner_id)

@router.put("/", response_model=schemas.Organization)
def update_organization(org: schemas.OrganizationUpdate, sb: Client = Depends(get_supabase), owner_id: str = Depends(get_current_user)):
    updated = crud.update_organization(sb, org_data=org, owner_id=owner_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Organization not found")
    return updated
