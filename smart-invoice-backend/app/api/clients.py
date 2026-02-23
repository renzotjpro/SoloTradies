from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.crud import crud
from app.schemas import schemas

router = APIRouter(prefix="/clients", tags=["Clients"])

def get_current_user_id():
    return 1

@router.get("/", response_model=List[schemas.Client])
def read_clients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    owner_id = get_current_user_id()
    return crud.get_clients(db, owner_id=owner_id, skip=skip, limit=limit)

@router.get("/{client_id}", response_model=schemas.Client)
def read_client(client_id: int, db: Session = Depends(get_db)):
    owner_id = get_current_user_id()
    db_client = crud.get_client(db, client_id=client_id, owner_id=owner_id)
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    return db_client

@router.post("/", response_model=schemas.Client)
def create_client(client: schemas.ClientCreate, db: Session = Depends(get_db)):
    owner_id = get_current_user_id()
    return crud.create_client(db=db, client=client, owner_id=owner_id)

@router.put("/{client_id}", response_model=schemas.Client)
def update_client(client_id: int, client: schemas.ClientUpdate, db: Session = Depends(get_db)):
    owner_id = get_current_user_id()
    db_client = crud.update_client(db, client_id=client_id, client_data=client, owner_id=owner_id)
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    return db_client

@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db)):
    owner_id = get_current_user_id()
    success = crud.delete_client(db, client_id=client_id, owner_id=owner_id)
    if not success:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"detail": "Client deleted"}
