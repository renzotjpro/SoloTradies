from pathlib import Path
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
import weasyprint

TEMPLATE_DIR = Path(__file__).parent.parent / "templates"
_env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))


def _fmt_currency(value) -> str:
    try:
        return f"${float(value):,.2f}"
    except (TypeError, ValueError):
        return "$0.00"


def _fmt_date(iso) -> str:
    if not iso:
        return "—"
    try:
        # Handle both "2026-01-15" and "2026-01-15T00:00:00" formats
        dt = datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
        return dt.strftime("%-d %b %Y")   # e.g. "15 Jan 2026"
    except Exception:
        return str(iso)


def generate_invoice_pdf(invoice_data: dict) -> bytes:
    """
    Accepts a merged dict of invoice + branding data and returns raw PDF bytes.

    Expected keys (all optional with sensible defaults):
      Branding: business_name, abn, phone, email_sender, sender_address,
                accent_color, payment_details, footer_message
      Invoice:  invoice_number, issue_date, due_date, status,
                subtotal, tax_amount, total_amount, notes
      Client:   client (dict with name, company, email, address, abn)
      Items:    items (list of dicts with description, quantity, unit_price, amount, tax_rate)
    """
    template = _env.get_template("invoice.html")

    accent = invoice_data.get("accent_color") or "#743781"

    ctx = {
        # Sender / branding
        "business_name":   invoice_data.get("business_name") or "Your Business Name",
        "abn":             invoice_data.get("abn"),
        "phone":           invoice_data.get("phone"),
        "email_sender":    invoice_data.get("email_sender"),
        "sender_address":  invoice_data.get("sender_address"),
        "accent_color":    accent,
        "payment_details": invoice_data.get("payment_details"),
        "footer_message":  invoice_data.get("footer_message"),
        # Invoice header
        "invoice_number":  invoice_data.get("invoice_number") or "—",
        "issue_date":      _fmt_date(invoice_data.get("issue_date")),
        "due_date":        _fmt_date(invoice_data.get("due_date")),
        "status":          invoice_data.get("status") or "Draft",
        "subtotal":        _fmt_currency(invoice_data.get("subtotal", 0)),
        "tax_amount":      _fmt_currency(invoice_data.get("tax_amount", 0)),
        "total_amount":    _fmt_currency(invoice_data.get("total_amount", 0)),
        "notes":           invoice_data.get("notes"),
        # Client
        "client": invoice_data.get("client") or {},
        # Line items — pre-format display values
        "items": [
            {
                **item,
                "qty_display":      f"{float(item.get('quantity', 1)):g}",
                "unit_price_fmt":   _fmt_currency(item.get("unit_price", 0)),
                "gst_fmt":          _fmt_currency(
                    float(item.get("amount", 0)) * float(item.get("tax_rate", 0))
                ),
                "total_fmt":        _fmt_currency(item.get("amount", 0)),
            }
            for item in (invoice_data.get("items") or [])
        ],
    }

    html = template.render(**ctx)
    return weasyprint.HTML(string=html).write_pdf()
