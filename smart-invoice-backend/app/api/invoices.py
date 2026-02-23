from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.crud import crud
from app.schemas import schemas

router = APIRouter(prefix="/invoices", tags=["Invoices"])

# Dependency simulating authentication (for MVP, hardcode user ID)
def get_current_user_id():
    return 1 # Assume user 1 is logged in

@router.get("/", response_model=List[schemas.Invoice])
def read_invoices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    owner_id = get_current_user_id()
    invoices = crud.get_invoices(db, owner_id=owner_id, skip=skip, limit=limit)
    return invoices

@router.post("/", response_model=schemas.Invoice)
def create_invoice(invoice: schemas.InvoiceCreate, db: Session = Depends(get_db)):
    owner_id = get_current_user_id()
    return crud.create_invoice(db=db, invoice=invoice, owner_id=owner_id)
