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
def get_clients(sb: Client, owner_id: str, skip: int = 0, limit: int = 100):
    result = (
        sb.table("clients")
        .select("*")
        .eq("owner_id", owner_id)
        .range(skip, skip + limit - 1)
        .execute()
    )
    return result.data

def get_clients_with_stats(sb: Client, owner_id: str, skip: int = 0, limit: int = 100):
    from datetime import date

    # Query 1: Get clients
    clients_result = (
        sb.table("clients")
        .select("*")
        .eq("owner_id", owner_id)
        .range(skip, skip + limit - 1)
        .execute()
    )
    clients = clients_result.data
    if not clients:
        return []

    # Query 2: Get unpaid invoices (Draft, Sent, Overdue)
    invoices_result = (
        sb.table("invoices")
        .select("client_id, total_amount, status, due_date")
        .eq("owner_id", owner_id)
        .in_("status", ["Draft", "Sent", "Overdue"])
        .execute()
    )

    # Aggregate per client
    today = date.today().isoformat()
    stats: dict = {}

    for inv in invoices_result.data:
        cid = inv["client_id"]
        if cid not in stats:
            stats[cid] = {"balance": 0.0, "overdue_balance": 0.0, "invoice_count": 0, "overdue_count": 0}

        amount = inv["total_amount"] or 0
        status = inv["status"]
        due_date = inv.get("due_date")

        stats[cid]["balance"] += amount
        stats[cid]["invoice_count"] += 1

        is_overdue = (status == "Overdue") or (status == "Sent" and due_date and due_date < today)
        if is_overdue:
            stats[cid]["overdue_balance"] += amount
            stats[cid]["overdue_count"] += 1

    # Merge stats into clients
    for client in clients:
        client_stats = stats.get(client["id"], {})
        client["balance"] = round(client_stats.get("balance", 0.0), 2)
        client["overdue_balance"] = round(client_stats.get("overdue_balance", 0.0), 2)
        client["invoice_count"] = client_stats.get("invoice_count", 0)
        client["overdue_count"] = client_stats.get("overdue_count", 0)

    return clients

def get_client(sb: Client, client_id: int, owner_id: str):
    result = (
        sb.table("clients")
        .select("*")
        .eq("id", client_id)
        .eq("owner_id", owner_id)
        .execute()
    )
    return result.data[0] if result.data else None

def create_client(sb: Client, client: schemas.ClientCreate, owner_id: str):
    now = datetime.now(timezone.utc).isoformat()
    data = {**client.model_dump(), "owner_id": owner_id, "created_at": now, "updated_at": now}
    result = sb.table("clients").insert(data).execute()
    return result.data[0]

def update_client(sb: Client, client_id: int, client_data: schemas.ClientUpdate, owner_id: str):
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

def delete_client(sb: Client, client_id: int, owner_id: str):
    existing = get_client(sb, client_id, owner_id)
    if not existing:
        return False
    sb.table("clients").delete().eq("id", client_id).eq("owner_id", owner_id).execute()
    return True

# --- Invoice CRUD ---
def get_invoices(sb: Client, owner_id: str, skip: int = 0, limit: int = 100):
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

def get_invoice(sb: Client, invoice_id: int, owner_id: str):
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

def create_invoice(sb: Client, invoice: schemas.InvoiceCreate, owner_id: str):
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
        "accent_color": invoice.accent_color,
        "header_layout": invoice.header_layout,
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

def update_invoice(sb: Client, invoice_id: int, invoice_data: schemas.InvoiceUpdate, owner_id: str):
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
    if invoice_data.accent_color is not None:
        update_fields["accent_color"] = invoice_data.accent_color
    if invoice_data.header_layout is not None:
        update_fields["header_layout"] = invoice_data.header_layout

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

def update_invoice_status(sb: Client, invoice_id: int, status: str, owner_id: str):
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

def delete_invoice(sb: Client, invoice_id: int, owner_id: str):
    existing = get_invoice(sb, invoice_id, owner_id)
    if not existing:
        return False
    sb.table("invoice_items").delete().eq("invoice_id", invoice_id).execute()
    sb.table("invoices").delete().eq("id", invoice_id).eq("owner_id", owner_id).execute()
    return True

# --- Expense CRUD ---
def get_expenses(sb: Client, owner_id: str, skip: int = 0, limit: int = 100,
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

def get_expense(sb: Client, expense_id: int, owner_id: str):
    result = (
        sb.table("expenses")
        .select("*")
        .eq("id", expense_id)
        .eq("owner_id", owner_id)
        .execute()
    )
    return result.data[0] if result.data else None

def create_expense(sb: Client, expense: schemas.ExpenseCreate, owner_id: str):
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

def update_expense(sb: Client, expense_id: int, expense_data: schemas.ExpenseUpdate, owner_id: str):
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

def delete_expense(sb: Client, expense_id: int, owner_id: str):
    existing = get_expense(sb, expense_id, owner_id)
    if not existing:
        return False
    sb.table("expenses").delete().eq("id", expense_id).eq("owner_id", owner_id).execute()
    return True

# --- Dashboard Stats ---
def get_overview_stats(sb: Client, owner_id: str) -> schemas.OverviewStats:
    from datetime import date
    today = date.today()
    first_of_month = today.replace(day=1).isoformat()

    # Total invoice count
    all_invoices = sb.table("invoices").select("id").eq("owner_id", owner_id).execute()
    total_invoices = len(all_invoices.data)

    # Outstanding amount (Draft, Sent, Overdue)
    outstanding = (
        sb.table("invoices")
        .select("total_amount")
        .eq("owner_id", owner_id)
        .in_("status", ["Draft", "Sent", "Overdue"])
        .execute()
    )
    outstanding_amount = sum(row["total_amount"] or 0 for row in outstanding.data)

    # Paid this month (using updated_at as proxy for payment date)
    paid_month = (
        sb.table("invoices")
        .select("total_amount")
        .eq("owner_id", owner_id)
        .eq("status", "Paid")
        .gte("updated_at", first_of_month)
        .execute()
    )
    paid_this_month = sum(row["total_amount"] or 0 for row in paid_month.data)

    # Upcoming payments: invoices with Sent or Overdue status awaiting collection
    upcoming = (
        sb.table("invoices")
        .select("id")
        .eq("owner_id", owner_id)
        .in_("status", ["Sent", "Overdue"])
        .execute()
    )
    upcoming_payments = len(upcoming.data)

    return schemas.OverviewStats(
        total_invoices=total_invoices,
        outstanding_amount=float(outstanding_amount),
        paid_this_month=float(paid_this_month),
        upcoming_payments=upcoming_payments,
    )


def get_cashflow_summary(sb: Client, owner_id: str, months_back: int = 6) -> list:
    from datetime import date
    from collections import defaultdict

    today = date.today()
    # Build ordered list of (year, month) for the last `months_back` months
    month_keys = []
    for i in range(months_back - 1, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        month_keys.append((y, m))

    # Start date = first of the earliest month
    start_year, start_month = month_keys[0]
    start_date = date(start_year, start_month, 1).isoformat()

    result = (
        sb.table("invoices")
        .select("total_amount, updated_at")
        .eq("owner_id", owner_id)
        .eq("status", "Paid")
        .gte("updated_at", start_date)
        .execute()
    )

    monthly: dict = defaultdict(float)
    for row in result.data:
        dt_str = row["updated_at"]
        # Parse ISO datetime (handles both +00:00 and Z suffixes)
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        key = (dt.year, dt.month)
        monthly[key] += row["total_amount"]

    return [
        schemas.CashflowDataPoint(
            month=datetime(y, m, 1).strftime("%b"),
            amount=float(monthly.get((y, m), 0)),
        )
        for y, m in month_keys
    ]


def get_invoice_status_summary(sb: Client, owner_id: str) -> list:
    result = (
        sb.table("invoices")
        .select("status, total_amount")
        .eq("owner_id", owner_id)
        .execute()
    )

    status_totals: dict = {"Draft": 0.0, "Sent": 0.0, "Paid": 0.0, "Overdue": 0.0}
    for row in result.data:
        status = row["status"]
        if status in status_totals:
            status_totals[status] += row["total_amount"]

    return [
        schemas.InvoiceStatusDataPoint(status=status, amount=float(amount))
        for status, amount in status_totals.items()
    ]


def get_dashboard_stats(sb: Client, owner_id: str) -> schemas.DashboardStats:
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
def get_organization(sb: Client, owner_id: str):
    result = (
        sb.table("organizations")
        .select("*")
        .eq("owner_id", owner_id)
        .execute()
    )
    return result.data[0] if result.data else None

def create_organization(sb: Client, org: schemas.OrganizationCreate, owner_id: str):
    now = datetime.now(timezone.utc).isoformat()
    data = {**org.model_dump(), "owner_id": owner_id, "created_at": now, "updated_at": now}
    result = sb.table("organizations").insert(data).execute()
    return result.data[0]

def update_organization(sb: Client, org_data: schemas.OrganizationUpdate, owner_id: str):
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

# --- Branding CRUD ---
def get_branding(sb: Client, owner_id: str):
    result = (
        sb.table("invoice_branding_settings")
        .select("*")
        .eq("owner_id", owner_id)
        .execute()
    )
    return result.data[0] if result.data else None

def upsert_branding(sb: Client, branding_data: schemas.BrandingSettingsUpdate, owner_id: str):
    now = datetime.now(timezone.utc).isoformat()
    existing = get_branding(sb, owner_id)
    update_fields = {**branding_data.model_dump(exclude_unset=True), "updated_at": now}

    if existing:
        result = (
            sb.table("invoice_branding_settings")
            .update(update_fields)
            .eq("owner_id", owner_id)
            .execute()
        )
    else:
        update_fields["owner_id"] = owner_id
        update_fields["created_at"] = now
        result = sb.table("invoice_branding_settings").insert(update_fields).execute()

    return result.data[0] if result.data else None

def get_labels(sb: Client, owner_id: str) -> dict:
    result = (
        sb.table("invoice_custom_labels")
        .select("label_key, label_value")
        .eq("owner_id", owner_id)
        .execute()
    )
    return {row["label_key"]: row["label_value"] for row in result.data}

def upsert_label(sb: Client, label_key: str, label_value: str, owner_id: str):
    now = datetime.now(timezone.utc).isoformat()
    existing = (
        sb.table("invoice_custom_labels")
        .select("id")
        .eq("owner_id", owner_id)
        .eq("label_key", label_key)
        .execute()
    )
    if existing.data:
        result = (
            sb.table("invoice_custom_labels")
            .update({"label_value": label_value, "updated_at": now})
            .eq("owner_id", owner_id)
            .eq("label_key", label_key)
            .execute()
        )
    else:
        result = (
            sb.table("invoice_custom_labels")
            .insert({"owner_id": owner_id, "label_key": label_key, "label_value": label_value, "created_at": now, "updated_at": now})
            .execute()
        )
    return result.data[0] if result.data else None

def upsert_labels_batch(sb: Client, labels: dict, owner_id: str):
    """Upsert multiple labels at once. labels is a dict of {label_key: label_value}."""
    for key, value in labels.items():
        upsert_label(sb, key, value, owner_id)
    return get_labels(sb, owner_id)

def delete_label(sb: Client, label_key: str, owner_id: str) -> bool:
    result = (
        sb.table("invoice_custom_labels")
        .delete()
        .eq("owner_id", owner_id)
        .eq("label_key", label_key)
        .execute()
    )
    return len(result.data) > 0

def get_branding_with_labels(sb: Client, owner_id: str):
    branding = get_branding(sb, owner_id)
    labels = get_labels(sb, owner_id)
    if branding is None:
        branding = {}
    branding["labels"] = labels
    return branding

# --- Conversation CRUD ---
def create_conversation(sb: Client, owner_id: str, title: str = None):
    now = datetime.now(timezone.utc).isoformat()
    data = {
        "owner_id": owner_id,
        "title": title,
        "created_at": now,
        "updated_at": now,
    }
    result = sb.table("conversations").insert(data).execute()
    return result.data[0]

def get_conversations(sb: Client, owner_id: str, limit: int = 20, offset: int = 0):
    result = (
        sb.table("conversations")
        .select("*")
        .eq("owner_id", owner_id)
        .eq("is_archived", False)
        .order("updated_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data

def get_conversation(sb: Client, conversation_id: str, owner_id: str):
    result = (
        sb.table("conversations")
        .select("*")
        .eq("id", conversation_id)
        .eq("owner_id", owner_id)
        .execute()
    )
    return result.data[0] if result.data else None

def update_conversation(sb: Client, conversation_id: str, owner_id: str, updates: dict):
    now = datetime.now(timezone.utc).isoformat()
    updates["updated_at"] = now
    result = (
        sb.table("conversations")
        .update(updates)
        .eq("id", conversation_id)
        .eq("owner_id", owner_id)
        .execute()
    )
    return result.data[0] if result.data else None

def delete_conversation(sb: Client, conversation_id: str, owner_id: str):
    existing = get_conversation(sb, conversation_id, owner_id)
    if not existing:
        return False
    sb.table("conversations").delete().eq("id", conversation_id).eq("owner_id", owner_id).execute()
    return True

def add_message(sb: Client, conversation_id: str, role: str, content: str, metadata: dict = None):
    now = datetime.now(timezone.utc).isoformat()
    data = {
        "conversation_id": conversation_id,
        "role": role,
        "content": content,
        "metadata": metadata,
        "created_at": now,
    }
    result = sb.table("conversation_messages").insert(data).execute()
    # Touch conversation updated_at
    sb.table("conversations").update({"updated_at": now}).eq("id", conversation_id).execute()
    return result.data[0]

def get_messages(sb: Client, conversation_id: str, limit: int = 100, offset: int = 0):
    result = (
        sb.table("conversation_messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data

# --- Memory CRUD ---
def upsert_memory(sb: Client, owner_id: str, category: str, key: str, value: str,
                  subject: str = None, source: str = "agent"):
    from app.memory.embeddings import generate_embedding

    now = datetime.now(timezone.utc).isoformat()
    embed_text = f"{key} {value} {subject or ''}".strip()
    embedding = generate_embedding(embed_text)

    data = {
        "owner_id": owner_id,
        "category": category,
        "subject": subject,
        "key": key,
        "value": value,
        "source": source,
        "created_at": now,
        "updated_at": now,
    }
    if embedding is not None:
        data["embedding"] = str(embedding)

    result = (
        sb.table("user_memories")
        .upsert(data, on_conflict="owner_id,category,subject,key")
        .execute()
    )
    return result.data[0] if result.data else None

def get_memories(sb: Client, owner_id: str, category: str = None, subject: str = None):
    query = sb.table("user_memories").select("*").eq("owner_id", owner_id)
    if category:
        query = query.eq("category", category)
    if subject:
        query = query.eq("subject", subject)
    result = query.order("updated_at", desc=True).execute()
    return result.data

def delete_memory(sb: Client, memory_id: str, owner_id: str):
    result = (
        sb.table("user_memories")
        .delete()
        .eq("id", memory_id)
        .eq("owner_id", owner_id)
        .execute()
    )
    return len(result.data) > 0

# --- Search / Query Functions (used by agent tools) ---

def search_clients(sb: Client, owner_id: str, query: str, search_by: str = "name"):
    """Flexible client search with fuzzy matching.
    search_by: 'name', 'email', 'company', 'abn', 'state'
    """
    import re as _re

    if search_by == "abn":
        digits = _re.sub(r"\D", "", query)
        result = (
            sb.table("clients").select("*")
            .eq("owner_id", owner_id)
            .ilike("abn", f"%{digits}%")
            .execute()
        )
    elif search_by == "state":
        # Normalize common Australian state abbreviations
        state_map = {
            "queensland": "qld", "new south wales": "nsw", "victoria": "vic",
            "tasmania": "tas", "south australia": "sa", "western australia": "wa",
            "northern territory": "nt", "australian capital territory": "act",
        }
        q = query.lower().strip()
        terms = [q]
        # Add reverse mapping: if user typed abbreviation, also search full name, and vice versa
        for full, abbr in state_map.items():
            if q == abbr:
                terms.append(full)
            elif q == full:
                terms.append(abbr)
        or_filter = ",".join(f"state.ilike.%{t}%" for t in terms)
        result = (
            sb.table("clients").select("*")
            .eq("owner_id", owner_id)
            .or_(or_filter)
            .execute()
        )
    else:
        result = (
            sb.table("clients").select("*")
            .eq("owner_id", owner_id)
            .ilike(search_by, f"%{query}%")
            .execute()
        )
    return result.data


def search_invoices(sb: Client, owner_id: str, invoice_number: str = None,
                    client_id: int = None, status: str = None,
                    date_from: str = None, date_to: str = None,
                    min_amount: float = None, max_amount: float = None):
    """Flexible invoice search with chained filters."""
    query = (
        sb.table("invoices")
        .select("*, clients(name, company, email), invoice_items(*)")
        .eq("owner_id", owner_id)
    )

    if invoice_number:
        # Try exact match first
        exact = (
            sb.table("invoices")
            .select("*, clients(name, company, email), invoice_items(*)")
            .eq("owner_id", owner_id)
            .eq("invoice_number", invoice_number)
            .execute()
        )
        if exact.data:
            return _normalize_invoice_rows(exact.data)
        # Fallback to ILIKE partial match
        query = query.ilike("invoice_number", f"%{invoice_number}%")
    if client_id:
        query = query.eq("client_id", client_id)
    if status:
        # Support common variations
        status_lower = status.lower()
        if status_lower in ("unpaid", "outstanding"):
            query = query.in_("status", ["Draft", "Sent", "Overdue"])
        elif status_lower == "overdue":
            query = query.eq("status", "Overdue")
        elif status_lower == "paid":
            query = query.eq("status", "Paid")
        elif status_lower == "draft":
            query = query.eq("status", "Draft")
        elif status_lower == "sent":
            query = query.eq("status", "Sent")
        else:
            query = query.ilike("status", f"%{status}%")
    if date_from:
        query = query.gte("issue_date", date_from)
    if date_to:
        query = query.lte("issue_date", date_to)
    if min_amount is not None:
        query = query.gte("total_amount", min_amount)
    if max_amount is not None:
        query = query.lte("total_amount", max_amount)

    query = query.order("issue_date", desc=True)
    result = query.execute()
    return _normalize_invoice_rows(result.data)


def _normalize_invoice_rows(rows: list) -> list:
    """Normalize Supabase nested select keys for invoice rows."""
    invoices = []
    for row in rows:
        row["items"] = row.pop("invoice_items", [])
        row["client"] = row.pop("clients", None)
        invoices.append(row)
    return invoices


def search_expenses(sb: Client, owner_id: str, category: str = None,
                    client_id: int = None, invoice_id: int = None,
                    date_from: str = None, date_to: str = None,
                    description: str = None, missing_receipt: bool = False):
    """Flexible expense search with chained filters."""
    query = sb.table("expenses").select("*").eq("owner_id", owner_id)

    if category:
        query = query.ilike("category", f"%{category}%")
    if client_id:
        query = query.eq("client_id", client_id)
    if invoice_id:
        query = query.eq("invoice_id", invoice_id)
    if date_from:
        query = query.gte("expense_date", date_from)
    if date_to:
        query = query.lte("expense_date", date_to)
    if description:
        query = query.ilike("description", f"%{description}%")
    if missing_receipt:
        query = query.is_("receipt_url", "null")

    result = query.order("expense_date", desc=True).execute()
    return result.data


def search_conversations_by_query(sb: Client, owner_id: str, query_text: str = None, limit: int = 5):
    """Search conversations by title/summary or return most recent."""
    q = (
        sb.table("conversations")
        .select("id, title, summary, updated_at")
        .eq("owner_id", owner_id)
        .eq("is_archived", False)
    )
    if query_text:
        pattern = f"%{query_text}%"
        q = q.or_(f"title.ilike.{pattern},summary.ilike.{pattern}")
    q = q.order("updated_at", desc=True).limit(limit)
    result = q.execute()
    return result.data


def get_gst_summary(sb: Client, owner_id: str, date_from: str, date_to: str) -> dict:
    """Calculate GST collected (invoices) vs GST paid (expenses) for a date range."""
    # GST collected from invoices (exclude drafts)
    inv_result = (
        sb.table("invoices")
        .select("tax_amount, total_amount")
        .eq("owner_id", owner_id)
        .neq("status", "Draft")
        .gte("issue_date", date_from)
        .lte("issue_date", date_to)
        .execute()
    )
    gst_collected = sum(row["tax_amount"] or 0 for row in inv_result.data)
    invoice_total = sum(row["total_amount"] or 0 for row in inv_result.data)
    invoice_count = len(inv_result.data)

    # GST paid on expenses
    exp_result = (
        sb.table("expenses")
        .select("amount, gst_included")
        .eq("owner_id", owner_id)
        .gte("expense_date", date_from)
        .lte("expense_date", date_to)
        .execute()
    )
    gst_paid = sum(row["gst_included"] or 0 for row in exp_result.data)
    expense_total = sum(row["amount"] or 0 for row in exp_result.data)
    expense_count = len(exp_result.data)

    return {
        "gst_collected": round(gst_collected, 2),
        "gst_paid": round(gst_paid, 2),
        "net_gst": round(gst_collected - gst_paid, 2),
        "invoice_total": round(invoice_total, 2),
        "invoice_count": invoice_count,
        "expense_total": round(expense_total, 2),
        "expense_count": expense_count,
    }


def get_client_revenue(sb: Client, owner_id: str, client_id: int,
                       date_from: str = None, date_to: str = None) -> dict:
    """Get revenue breakdown for a specific client."""
    query = (
        sb.table("invoices")
        .select("total_amount, status")
        .eq("owner_id", owner_id)
        .eq("client_id", client_id)
    )
    if date_from:
        query = query.gte("issue_date", date_from)
    if date_to:
        query = query.lte("issue_date", date_to)
    result = query.execute()

    total_billed = 0.0
    paid = 0.0
    outstanding = 0.0
    for row in result.data:
        amount = row["total_amount"] or 0
        total_billed += amount
        if row["status"] == "Paid":
            paid += amount
        else:
            outstanding += amount

    return {
        "total_billed": round(total_billed, 2),
        "paid": round(paid, 2),
        "outstanding": round(outstanding, 2),
        "invoice_count": len(result.data),
    }


def search_memories(sb: Client, owner_id: str, query_text: str, category: str = None):
    """Search memories using pgvector similarity, with ILIKE fallback."""
    from app.memory.embeddings import generate_embedding

    embedding = generate_embedding(query_text)
    if embedding is not None:
        try:
            result = sb.rpc("match_memories", {
                "query_embedding": str(embedding),
                "match_count": 15,
                "filter_owner_id": owner_id,
            }).execute()
            if result.data:
                if category:
                    return [m for m in result.data if m.get("category") == category]
                return result.data
        except Exception:
            pass  # Fall through to ILIKE

    # Fallback: ILIKE text search
    pattern = f"%{query_text}%"
    q = (
        sb.table("user_memories")
        .select("*")
        .eq("owner_id", owner_id)
        .or_(f"key.ilike.{pattern},value.ilike.{pattern},subject.ilike.{pattern}")
    )
    if category:
        q = q.eq("category", category)
    result = q.order("confidence", desc=True).execute()
    return result.data
