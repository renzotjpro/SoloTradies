from fastapi import APIRouter, Depends
from supabase import Client
from app.database import get_supabase
from app.auth import get_current_user
from app.schemas import schemas
from app.crud import crud

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=schemas.OverviewStats)
def get_overview(sb: Client = Depends(get_supabase), owner_id: str = Depends(get_current_user)):
    return crud.get_overview_stats(sb, owner_id)


@router.get("/cashflow", response_model=list[schemas.CashflowDataPoint])
def get_cashflow(sb: Client = Depends(get_supabase), owner_id: str = Depends(get_current_user)):
    return crud.get_cashflow_summary(sb, owner_id)


@router.get("/invoice-stats", response_model=list[schemas.InvoiceStatusDataPoint])
def get_invoice_stats(sb: Client = Depends(get_supabase), owner_id: str = Depends(get_current_user)):
    return crud.get_invoice_status_summary(sb, owner_id)
