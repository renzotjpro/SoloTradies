from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Client Schemas ---
class ClientBase(BaseModel):
    name: str
    email: Optional[str] = None
    address: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    id: int
    owner_id: int

    class Config:
        orm_mode = True
        from_attributes = True

# --- Invoice Schemas ---
class InvoiceBase(BaseModel):
    description: str
    amount: float
    due_date: Optional[datetime] = None
    status: Optional[str] = "Draft"

class InvoiceCreate(InvoiceBase):
    client_id: int
    # In a real app, invoice_number might be auto-generated or passed
    invoice_number: str

class Invoice(InvoiceBase):
    id: int
    invoice_number: str
    issue_date: datetime
    owner_id: int
    client_id: int
    
    # Nested representation if needed
    client: Optional[Client] = None

    class Config:
        orm_mode = True
        from_attributes = True

# --- User Schemas ---
class UserBase(BaseModel):
    email: str
    name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    
    class Config:
        orm_mode = True
        from_attributes = True
