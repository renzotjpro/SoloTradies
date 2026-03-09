from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from typing import List, Optional

from app.database import get_supabase
from app.auth import get_current_user
from app.crud import crud
from app.schemas import schemas

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.get("/", response_model=List[schemas.Expense])
def read_expenses(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = Query(None, description="Filter by category: Materials, Fuel, Insurance, Tools, Other"),
    client_id: Optional[int] = Query(None, description="Filter by client"),
    invoice_id: Optional[int] = Query(None, description="Filter by invoice/job"),
    sb: Client = Depends(get_supabase),
    owner_id: str = Depends(get_current_user),
):
    return crud.get_expenses(
        sb, owner_id=owner_id, skip=skip, limit=limit,
        category=category, client_id=client_id, invoice_id=invoice_id,
    )

@router.get("/{expense_id}", response_model=schemas.Expense)
def read_expense(expense_id: int, sb: Client = Depends(get_supabase), owner_id: str = Depends(get_current_user)):
    db_expense = crud.get_expense(sb, expense_id=expense_id, owner_id=owner_id)
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return db_expense

@router.post("/", response_model=schemas.Expense)
def create_expense(expense: schemas.ExpenseCreate, sb: Client = Depends(get_supabase), owner_id: str = Depends(get_current_user)):
    return crud.create_expense(sb=sb, expense=expense, owner_id=owner_id)

@router.put("/{expense_id}", response_model=schemas.Expense)
def update_expense(expense_id: int, expense: schemas.ExpenseUpdate, sb: Client = Depends(get_supabase), owner_id: str = Depends(get_current_user)):
    db_expense = crud.update_expense(sb, expense_id=expense_id, expense_data=expense, owner_id=owner_id)
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return db_expense

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, sb: Client = Depends(get_supabase), owner_id: str = Depends(get_current_user)):
    success = crud.delete_expense(sb, expense_id=expense_id, owner_id=owner_id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"detail": "Expense deleted"}
