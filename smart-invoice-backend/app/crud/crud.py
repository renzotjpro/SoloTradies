from supabase import Client
from app.schemas import schemas
from datetime import datetime, timezone

# --- User CRUD ---
def get_user(sb: Client, user_id: int):
    result = sb.table("users").select("*").eq("id", user_id).execute()
    return result.data[0] if result.data else None

def get_user_by_email(sb: Client, email: str):
    result = sb.table("users").select("*").eq("email", email).execute()
    return result.data[0] if result.data else None

def create_user(sb: Client, user: schemas.UserCreate):
    now = datetime.now(timezone.utc).isoformat()
    # In a real app, hash the password properly
    fake_hashed_password = user.password + "notreallyhashed"
    data = {
        "email": user.email,
        "name": user.name,
        "hashed_password": fake_hashed_password,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = sb.table("users").insert(data).execute()
    return result.data[0]

# --- Client CRUD ---
def get_clients(sb: Client, owner_id: int, skip: int = 0, limit: int = 100):
    result = (
        sb.table("clients")
        .select("*")
        .eq("owner_id", owner_id)
        .range(skip, skip + limit - 1)
        .execute()
    )
    return result.data

def get_client(sb: Client, client_id: int, owner_id: int):
    result = (
        sb.table("clients")
        .select("*")
        .eq("id", client_id)
        .eq("owner_id", owner_id)
        .execute()
    )
    return result.data[0] if result.data else None

def create_client(sb: Client, client: schemas.ClientCreate, owner_id: int):
    now = datetime.now(timezone.utc).isoformat()
    data = {**client.model_dump(), "owner_id": owner_id, "created_at": now, "updated_at": now}
    result = sb.table("clients").insert(data).execute()
    return result.data[0]

def update_client(sb: Client, client_id: int, client_data: schemas.ClientUpdate, owner_id: int):
    existing = get_client(sb, client_id, owner_id)
    if not existing:
        return None
    now = datetime.now(timezone.utc).isoformat()
    update_data = {**client_data.model_dump(exclude_unset=True), "updated_at": now}
    result = (
        sb.table("clients")
        .update(update_data)
        .eq("id", client_id)
        .eq("owner_id", owner_id)
        .execute()
    )
    return result.data[0] if result.data else None

def delete_client(sb: Client, client_id: int, owner_id: int):
    existing = get_client(sb, client_id, owner_id)
    if not existing:
        return False
    sb.table("clients").delete().eq("id", client_id).eq("owner_id", owner_id).execute()
    return True

# --- Invoice CRUD ---
def get_invoices(sb: Client, owner_id: int, skip: int = 0, limit: int = 100):
    result = (
        sb.table("invoices")
        .select("*, invoice_items(*), clients(*)")
        .eq("owner_id", owner_id)
        .range(skip, skip + limit - 1)
        .execute()
    )
    invoices = []
    for row in result.data:
        row["items"] = row.pop("invoice_items", [])
        row["client"] = row.pop("clients", None)
        invoices.append(row)
    return invoices

def get_invoice(sb: Client, invoice_id: int, owner_id: int):
    result = (
        sb.table("invoices")
        .select("*, invoice_items(*), clients(*)")
        .eq("id", invoice_id)
        .eq("owner_id", owner_id)
        .execute()
    )
    if not result.data:
        return None
    row = result.data[0]
    row["items"] = row.pop("invoice_items", [])
    row["client"] = row.pop("clients", None)
    return row

def create_invoice(sb: Client, invoice: schemas.InvoiceCreate, owner_id: int):
    # Compute line item amounts
    items_data = []
    subtotal = 0
    tax_amount = 0
    for item in invoice.items:
        amount = item.quantity * item.unit_price
        item_tax = amount * item.tax_rate
        subtotal += amount
        tax_amount += item_tax
        items_data.append({
            "description": item.description,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "amount": round(amount, 2),
            "tax_rate": item.tax_rate,
        })

    total_amount = subtotal + tax_amount
    now = datetime.now(timezone.utc).isoformat()

    # Insert the invoice
    invoice_data = {
        "invoice_number": invoice.invoice_number,
        "client_id": invoice.client_id,
        "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
        "status": invoice.status or "Draft",
        "notes": invoice.notes,
        "subtotal": round(subtotal, 2),
        "tax_amount": round(tax_amount, 2),
        "total_amount": round(total_amount, 2),
        "owner_id": owner_id,
        "issue_date": now,
        "created_at": now,
        "updated_at": now,
    }
    inv_result = sb.table("invoices").insert(invoice_data).execute()
    new_invoice = inv_result.data[0]
    invoice_id = new_invoice["id"]

    # Insert line items
    for item_data in items_data:
        item_data["invoice_id"] = invoice_id
        item_data["created_at"] = now

    if items_data:
        items_result = sb.table("invoice_items").insert(items_data).execute()
        new_invoice["items"] = items_result.data
    else:
        new_invoice["items"] = []

    return new_invoice

def update_invoice(sb: Client, invoice_id: int, invoice_data: schemas.InvoiceUpdate, owner_id: int):
    existing = get_invoice(sb, invoice_id, owner_id)
    if not existing:
        return None
    now = datetime.now(timezone.utc).isoformat()

    # Build update dict from provided fields
    update_fields: dict = {}
    if invoice_data.client_id is not None:
        update_fields["client_id"] = invoice_data.client_id
    if invoice_data.due_date is not None:
        update_fields["due_date"] = invoice_data.due_date.isoformat()
    if invoice_data.status is not None:
        update_fields["status"] = invoice_data.status
    if invoice_data.notes is not None:
        update_fields["notes"] = invoice_data.notes

    # If items provided, replace all line items and recompute totals
    if invoice_data.items is not None:
        # Delete old items
        sb.table("invoice_items").delete().eq("invoice_id", invoice_id).execute()

        # Compute new totals and insert
        items_data = []
        subtotal = 0
        tax_amount = 0
        for item in invoice_data.items:
            amount = item.quantity * item.unit_price
            item_tax = amount * item.tax_rate
            subtotal += amount
            tax_amount += item_tax
            items_data.append({
                "invoice_id": invoice_id,
                "description": item.description,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "amount": round(amount, 2),
                "tax_rate": item.tax_rate,
                "created_at": now,
            })
        if items_data:
            sb.table("invoice_items").insert(items_data).execute()

        update_fields["subtotal"] = round(subtotal, 2)
        update_fields["tax_amount"] = round(tax_amount, 2)
        update_fields["total_amount"] = round(subtotal + tax_amount, 2)

    update_fields["updated_at"] = now
    sb.table("invoices").update(update_fields).eq("id", invoice_id).eq("owner_id", owner_id).execute()
    return get_invoice(sb, invoice_id, owner_id)

def update_invoice_status(sb: Client, invoice_id: int, status: str, owner_id: int):
    existing = get_invoice(sb, invoice_id, owner_id)
    if not existing:
        return None
    now = datetime.now(timezone.utc).isoformat()
    result = (
        sb.table("invoices")
        .update({"status": status, "updated_at": now})
        .eq("id", invoice_id)
        .eq("owner_id", owner_id)
        .execute()
    )
    if not result.data:
        return None
    return get_invoice(sb, invoice_id, owner_id)

def delete_invoice(sb: Client, invoice_id: int, owner_id: int):
    existing = get_invoice(sb, invoice_id, owner_id)
    if not existing:
        return False
    sb.table("invoice_items").delete().eq("invoice_id", invoice_id).execute()
    sb.table("invoices").delete().eq("id", invoice_id).eq("owner_id", owner_id).execute()
    return True

# --- Expense CRUD ---
def get_expenses(sb: Client, owner_id: int, skip: int = 0, limit: int = 100,
                 category: str = None, client_id: int = None, invoice_id: int = None):
    query = sb.table("expenses").select("*").eq("owner_id", owner_id)
    if category:
        query = query.eq("category", category)
    if client_id:
        query = query.eq("client_id", client_id)
    if invoice_id:
        query = query.eq("invoice_id", invoice_id)
    result = query.range(skip, skip + limit - 1).execute()
    return result.data

def get_expense(sb: Client, expense_id: int, owner_id: int):
    result = (
        sb.table("expenses")
        .select("*")
        .eq("id", expense_id)
        .eq("owner_id", owner_id)
        .execute()
    )
    return result.data[0] if result.data else None

def create_expense(sb: Client, expense: schemas.ExpenseCreate, owner_id: int):
    # Auto-calculate GST: in Australia, GST is 1/11 of the total price
    gst_included = round(expense.amount / 11, 2)
    now = datetime.now(timezone.utc).isoformat()
    data = {
        "description": expense.description,
        "amount": expense.amount,
        "gst_included": gst_included,
        "category": expense.category,
        "expense_date": expense.expense_date.isoformat(),
        "receipt_url": expense.receipt_url,
        "client_id": expense.client_id,
        "invoice_id": expense.invoice_id,
        "owner_id": owner_id,
        "created_at": now,
        "updated_at": now,
    }
    result = sb.table("expenses").insert(data).execute()
    return result.data[0]

def update_expense(sb: Client, expense_id: int, expense_data: schemas.ExpenseUpdate, owner_id: int):
    existing = get_expense(sb, expense_id, owner_id)
    if not existing:
        return None
    now = datetime.now(timezone.utc).isoformat()
    update_data = {**expense_data.model_dump(exclude_unset=True), "updated_at": now}
    # Serialize datetime fields
    if "expense_date" in update_data and update_data["expense_date"]:
        update_data["expense_date"] = update_data["expense_date"].isoformat()
    # Recalculate GST if amount changed
    if "amount" in update_data:
        update_data["gst_included"] = round(update_data["amount"] / 11, 2)
    result = (
        sb.table("expenses")
        .update(update_data)
        .eq("id", expense_id)
        .eq("owner_id", owner_id)
        .execute()
    )
    return result.data[0] if result.data else None

def delete_expense(sb: Client, expense_id: int, owner_id: int):
    existing = get_expense(sb, expense_id, owner_id)
    if not existing:
        return False
    sb.table("expenses").delete().eq("id", expense_id).eq("owner_id", owner_id).execute()
    return True

# --- Dashboard Stats ---
def get_dashboard_stats(sb: Client, owner_id: int) -> schemas.DashboardStats:
    # Revenue and GST from paid invoices
    paid = (
        sb.table("invoices")
        .select("total_amount, tax_amount")
        .eq("owner_id", owner_id)
        .eq("status", "Paid")
        .execute()
    )
    total_revenue = sum(row["total_amount"] for row in paid.data)
    gst_collected = sum(row["tax_amount"] for row in paid.data)

    # Outstanding from unpaid invoices
    outstanding = (
        sb.table("invoices")
        .select("total_amount")
        .eq("owner_id", owner_id)
        .in_("status", ["Draft", "Sent", "Overdue"])
        .execute()
    )
    outstanding_amount = sum(row["total_amount"] for row in outstanding.data)

    # Total expenses and claimable GST
    expenses = (
        sb.table("expenses")
        .select("amount, gst_included")
        .eq("owner_id", owner_id)
        .execute()
    )
    total_expenses = sum(row["amount"] for row in expenses.data)
    gst_claimable = sum(row["gst_included"] for row in expenses.data)

    return schemas.DashboardStats(
        total_revenue=float(total_revenue),
        outstanding_amount=float(outstanding_amount),
        total_expenses=float(total_expenses),
        gst_collected=float(gst_collected),
        gst_claimable=float(gst_claimable),
    )

# --- Organization CRUD ---
def get_organization(sb: Client, owner_id: int):
    result = (
        sb.table("organizations")
        .select("*")
        .eq("owner_id", owner_id)
        .execute()
    )
    return result.data[0] if result.data else None

def create_organization(sb: Client, org: schemas.OrganizationCreate, owner_id: int):
    now = datetime.now(timezone.utc).isoformat()
    data = {**org.model_dump(), "owner_id": owner_id, "created_at": now, "updated_at": now}
    result = sb.table("organizations").insert(data).execute()
    return result.data[0]

def update_organization(sb: Client, org_data: schemas.OrganizationUpdate, owner_id: int):
    existing = get_organization(sb, owner_id)
    if not existing:
        return None
    now = datetime.now(timezone.utc).isoformat()
    update_data = {**org_data.model_dump(exclude_unset=True), "updated_at": now}
    result = (
        sb.table("organizations")
        .update(update_data)
        .eq("owner_id", owner_id)
        .execute()
    )
    return result.data[0] if result.data else None
