from sqlalchemy.orm import Session
from app.models import models
from app.schemas import schemas

# --- User CRUD ---
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    # In a real app, hash the password properly
    fake_hashed_password = user.password + "notreallyhashed"
    db_user = models.User(email=user.email, name=user.name, hashed_password=fake_hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Client CRUD ---
def get_clients(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Client).filter(models.Client.owner_id == owner_id).offset(skip).limit(limit).all()

def create_client(db: Session, client: schemas.ClientCreate, owner_id: int):
    db_client = models.Client(**client.dict(), owner_id=owner_id)
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

# --- Invoice CRUD ---
def get_invoices(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Invoice).filter(models.Invoice.owner_id == owner_id).offset(skip).limit(limit).all()

def create_invoice(db: Session, invoice: schemas.InvoiceCreate, owner_id: int):
    db_invoice = models.Invoice(**invoice.dict(), owner_id=owner_id)
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice
