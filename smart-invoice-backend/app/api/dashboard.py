from fastapi import APIRouter, Depends
from supabase import Client
from app.database import get_supabase
from app.schemas import schemas
from app.crud import crud

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])

OWNER_ID = 1  # Hardcoded for MVP (no auth yet)


@router.get("/overview", response_model=schemas.OverviewStats)
def get_overview(sb: Client = Depends(get_supabase)):
    return crud.get_overview_stats(sb, OWNER_ID)


@router.get("/cashflow", response_model=list[schemas.CashflowDataPoint])
def get_cashflow(sb: Client = Depends(get_supabase)):
    return crud.get_cashflow_summary(sb, OWNER_ID)


@router.get("/invoice-stats", response_model=list[schemas.InvoiceStatusDataPoint])
def get_invoice_stats(sb: Client = Depends(get_supabase)):
    return crud.get_invoice_status_summary(sb, OWNER_ID)
