from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Client Schemas ---
class ClientBase(BaseModel):
    name: str
    email: Optional[str] = None
    address: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    abn: Optional[str] = None
    role: Optional[str] = None
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    abn: Optional[str] = None
    role: Optional[str] = None
    notes: Optional[str] = None

class Client(ClientBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Invoice Item Schemas ---
class InvoiceItemCreate(BaseModel):
    description: str
    quantity: float = 1
    unit_price: float
    tax_rate: float = 0.10

class InvoiceItemResponse(BaseModel):
    id: int
    description: str
    quantity: float
    unit_price: float
    amount: float
    tax_rate: float

    class Config:
        from_attributes = True

# --- Invoice Schemas ---
class InvoiceCreate(BaseModel):
    invoice_number: str
    client_id: int
    due_date: Optional[datetime] = None
    status: Optional[str] = "Draft"
    notes: Optional[str] = None
    items: List[InvoiceItemCreate]

class Invoice(BaseModel):
    id: int
    invoice_number: str
    description: Optional[str] = None
    issue_date: datetime
    due_date: Optional[datetime] = None
    status: str
    subtotal: float
    tax_amount: float
    total_amount: float
    notes: Optional[str] = None
    owner_id: int
    client_id: int
    client: Optional[Client] = None
    items: List[InvoiceItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class InvoiceUpdate(BaseModel):
    client_id: Optional[int] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[InvoiceItemCreate]] = None

class InvoiceStatusUpdate(BaseModel):
    status: str  # "Draft", "Sent", "Paid", "Overdue"

# --- Expense Schemas ---
class ExpenseCreate(BaseModel):
    description: str
    amount: float
    category: str  # Materials, Fuel, Insurance, Tools, Other
    expense_date: datetime
    receipt_url: Optional[str] = None
    client_id: Optional[int] = None
    invoice_id: Optional[int] = None

class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    expense_date: Optional[datetime] = None
    receipt_url: Optional[str] = None
    client_id: Optional[int] = None
    invoice_id: Optional[int] = None

class Expense(BaseModel):
    id: int
    description: str
    amount: float
    gst_included: float
    category: str
    expense_date: datetime
    receipt_url: Optional[str] = None
    client_id: Optional[int] = None
    invoice_id: Optional[int] = None
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- User Schemas ---
class UserBase(BaseModel):
    email: str
    name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Dashboard Schemas ---
class DashboardStats(BaseModel):
    total_revenue: float       # sum of paid invoices total_amount
    outstanding_amount: float  # sum of unpaid invoices total_amount
    total_expenses: float      # sum of all expenses
    gst_collected: float       # sum of tax_amount from paid invoices
    gst_claimable: float       # sum of gst_included from expenses
