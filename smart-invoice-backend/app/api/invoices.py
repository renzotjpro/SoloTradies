from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from supabase import Client
from typing import List

from app.database import get_supabase
from app.crud import crud
from app.schemas import schemas
from app.utils.pdf_generator import generate_invoice_pdf

router = APIRouter(prefix="/invoices", tags=["Invoices"])

# Dependency simulating authentication (for MVP, hardcode user ID)
def get_current_user_id():
    return 1 # Assume user 1 is logged in

@router.get("/", response_model=List[schemas.Invoice])
def read_invoices(skip: int = 0, limit: int = 100, sb: Client = Depends(get_supabase)):
    owner_id = get_current_user_id()
    invoices = crud.get_invoices(sb, owner_id=owner_id, skip=skip, limit=limit)
    return invoices

@router.get("/{invoice_id}", response_model=schemas.Invoice)
def read_invoice(invoice_id: int, sb: Client = Depends(get_supabase)):
    owner_id = get_current_user_id()
    invoice = crud.get_invoice(sb, invoice_id=invoice_id, owner_id=owner_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.post("/", response_model=schemas.Invoice)
def create_invoice(invoice: schemas.InvoiceCreate, sb: Client = Depends(get_supabase)):
    owner_id = get_current_user_id()
    return crud.create_invoice(sb=sb, invoice=invoice, owner_id=owner_id)

@router.put("/{invoice_id}", response_model=schemas.Invoice)
def update_invoice(invoice_id: int, invoice: schemas.InvoiceUpdate, sb: Client = Depends(get_supabase)):
    owner_id = get_current_user_id()
    result = crud.update_invoice(sb, invoice_id=invoice_id, invoice_data=invoice, owner_id=owner_id)
    if not result:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return result

@router.patch("/{invoice_id}/status", response_model=schemas.Invoice)
def update_invoice_status(invoice_id: int, body: schemas.InvoiceStatusUpdate, sb: Client = Depends(get_supabase)):
    owner_id = get_current_user_id()
    invoice = crud.update_invoice_status(sb, invoice_id=invoice_id, status=body.status, owner_id=owner_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int, sb: Client = Depends(get_supabase)):
    owner_id = get_current_user_id()
    success = crud.delete_invoice(sb, invoice_id=invoice_id, owner_id=owner_id)
    if not success:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"detail": "Invoice deleted"}


@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(invoice_id: int, sb: Client = Depends(get_supabase)):
    owner_id = get_current_user_id()
    invoice = crud.get_invoice(sb, invoice_id=invoice_id, owner_id=owner_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Merge branding (sender details, accent colour, payment info) into the invoice dict
    branding = crud.get_branding_with_labels(sb, owner_id=owner_id) or {}

    merged = {
        **invoice,
        "business_name":   branding.get("business_name") or branding.get("display_name"),
        "abn":             branding.get("abn"),
        "phone":           branding.get("phone"),
        "email_sender":    branding.get("email"),
        "sender_address":  branding.get("address"),
        "accent_color":    invoice.get("accent_color") or branding.get("colour_graphical"),
        "header_layout":   invoice.get("header_layout") or branding.get("header_layout") or "full_bar",
        "payment_details": branding.get("payment_details"),
        "footer_message":  branding.get("footer_message") if branding.get("show_footer_message") else None,
    }

    pdf_bytes = generate_invoice_pdf(merged)
    safe_num = (invoice.get("invoice_number") or str(invoice_id)).replace("/", "-")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="Invoice_{safe_num}.pdf"'},
    )
