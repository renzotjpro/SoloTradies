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

# --- Organization Schemas ---
class OrganizationBase(BaseModel):
    name: str
    abn: Optional[str] = None
    industry: Optional[str] = None
    tax_reg_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    postcode: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    abn: Optional[str] = None
    industry: Optional[str] = None
    tax_reg_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    postcode: Optional[str] = None

class Organization(OrganizationBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Branding Settings Schemas ---
class BrandingSettingsBase(BaseModel):
    # Brand
    logo_url: Optional[str] = None
    header_image_url: Optional[str] = None
    display_name: Optional[str] = None
    business_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    abn: Optional[str] = None
    colour_text: Optional[str] = '#333333'
    colour_graphical: Optional[str] = '#C0392B'

    # Font
    font_family: Optional[str] = 'Inter'
    font_size: Optional[str] = 'regular'

    # Design
    template_id: Optional[str] = 'tradie_classic'
    header_layout: Optional[str] = 'full_bar'
    footer_layout: Optional[str] = 'full_width'
    table_style: Optional[str] = 'bordered'
    logo_position: Optional[str] = 'top_left'

    # Visibility Toggles
    show_client_address: Optional[bool] = False
    show_client_abn: Optional[bool] = False
    show_quantity_column: Optional[bool] = True
    show_quantity_type: Optional[bool] = True
    show_currency_prefix: Optional[bool] = False
    show_gst_breakdown: Optional[bool] = True
    show_discount_row: Optional[bool] = False
    show_surcharge_row: Optional[bool] = False
    show_balance_due: Optional[bool] = True
    show_po_number: Optional[bool] = False
    show_deposit_due_date: Optional[bool] = False
    show_payment_details: Optional[bool] = True
    show_footer_message: Optional[bool] = True
    show_terms_conditions: Optional[bool] = False

    # Content
    payment_details: Optional[str] = 'Please make payments via direct deposit to:\nAcc Name: \nBSB: \nAcc No: '
    payment_terms: Optional[str] = '14_days'
    footer_message: Optional[str] = "Thank you for your business.\nI'm looking forward to working with you again in the future."
    terms_conditions: Optional[str] = None
    invoice_prefix: Optional[str] = None
    default_notes: Optional[str] = None

class BrandingSettingsCreate(BrandingSettingsBase):
    pass

class BrandingSettingsUpdate(BrandingSettingsBase):
    pass

class BrandingSettings(BrandingSettingsBase):
    id: str
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Custom Label Schemas ---
class CustomLabelCreate(BaseModel):
    label_key: str
    label_value: str

class CustomLabelUpdate(BaseModel):
    label_value: str

class CustomLabel(BaseModel):
    id: str
    owner_id: int
    label_key: str
    label_value: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BrandingWithLabels(BrandingSettings):
    labels: dict = {}  # label_key -> label_value map
