# PDF Update Roadmap — Layout Sync Fix

**Goal:** Make the downloaded PDF always match the header layout chosen in the invoice editor (full bar / centred / split).

---

## Root Cause

The PDF pipeline ignores the `header_layout` field that is already saved on the invoice.

| Layer | Problem |
|---|---|
| `invoices.py` | Does **not** pass `invoice["header_layout"]` into `generate_invoice_pdf()` |
| `pdf_generator.py` | Does **not** include `header_layout` in the Jinja2 template context |
| `invoice.html` | Has only **one** hard-coded header (full colour bar) — no layout branching |

---

## Files to Change

### 1. `smart-invoice-backend/app/api/invoices.py`

In the `download_invoice_pdf` function, add `header_layout` to the `merged` dict that is passed to `generate_invoice_pdf()`.

```python
# Around line 71 — inside `merged = { ... }`
"accent_color":   invoice.get("accent_color") or branding.get("colour_graphical"),
"header_layout":  invoice.get("header_layout") or branding.get("header_layout") or "full_bar",  # ← ADD THIS
"payment_details": branding.get("payment_details"),
```

---

### 2. `smart-invoice-backend/app/utils/pdf_generator.py`

Add `header_layout` to the `ctx` dict inside `generate_invoice_pdf()`.

```python
# Around line 51 — inside ctx = { ... }
"accent_color":   accent,
"header_layout":  invoice_data.get("header_layout") or "full_bar",   # ← ADD THIS
"payment_details": invoice_data.get("payment_details"),
```

---

### 3. `smart-invoice-backend/app/templates/invoice.html`

Replace the single hard-coded `<div class="header">` block (around line 279) with a Jinja2 conditional to render the correct layout.

#### Remove this (lines ~279–292):
```html
<div class="header">
  <div class="header-left">
    <div class="business-name">{{ business_name }}</div>
    <div class="business-meta">
      {% if abn %}ABN: {{ abn }}<br>{% endif %}
      {% if phone %}{{ phone }}<br>{% endif %}
      {% if email_sender %}{{ email_sender }}<br>{% endif %}
      {% if sender_address %}{{ sender_address }}{% endif %}
    </div>
  </div>
  <div class="header-right">
    <div class="invoice-title">Tax Invoice</div>
  </div>
</div>
```

#### Replace with:

```html
{% if header_layout == "centred" %}
<!-- ══ HEADER: CENTRED ══ -->
<div style="padding: 28px 36px 20px; text-align: center; border-bottom: 1px solid #e8e8e8;">
  <div style="display: inline-block; background-color: {{ accent_color }}; color: white;
              font-size: 18px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase;
              padding: 6px 16px; border-radius: 4px; margin-bottom: 12px;">
    TAX INVOICE
  </div>
  <div style="font-size: 20px; font-weight: bold; color: #222;">{{ business_name }}</div>
  {% if abn %}<div style="font-size: 10px; color: #999; margin-top: 2px;">ABN: {{ abn }}</div>{% endif %}
  {% if phone %}<div style="font-size: 10px; color: #777;">{{ phone }}</div>{% endif %}
  {% if email_sender %}<div style="font-size: 10px; color: #777;">{{ email_sender }}</div>{% endif %}
</div>

{% elif header_layout == "split" %}
<!-- ══ HEADER: SPLIT ══ -->
<div style="padding: 28px 36px 20px; display: flex; justify-content: space-between;
            align-items: flex-start; border-bottom: 1px solid #e8e8e8;">
  <div>
    <div style="font-size: 20px; font-weight: bold; color: #222;">{{ business_name }}</div>
    {% if abn %}<div style="font-size: 10px; color: #999; margin-top: 2px;">ABN: {{ abn }}</div>{% endif %}
    {% if sender_address %}<div style="font-size: 10px; color: #777; margin-top: 4px; white-space: pre-line;">{{ sender_address }}</div>{% endif %}
    {% if phone %}<div style="font-size: 10px; color: #777;">{{ phone }}</div>{% endif %}
    {% if email_sender %}<div style="font-size: 10px; color: #777;">{{ email_sender }}</div>{% endif %}
  </div>
  <div style="background-color: {{ accent_color }}; color: white; font-size: 18px;
              font-weight: bold; letter-spacing: 3px; text-transform: uppercase;
              padding: 6px 14px; border-radius: 4px;">
    TAX INVOICE
  </div>
</div>

{% else %}
<!-- ══ HEADER: FULL BAR (default) ══ -->
<div class="header">
  <div class="header-left">
    <div class="business-name">{{ business_name }}</div>
    <div class="business-meta">
      {% if abn %}ABN: {{ abn }}<br>{% endif %}
      {% if phone %}{{ phone }}<br>{% endif %}
      {% if email_sender %}{{ email_sender }}<br>{% endif %}
      {% if sender_address %}{{ sender_address }}{% endif %}
    </div>
  </div>
  <div class="header-right">
    <div class="invoice-title">Tax Invoice</div>
  </div>
</div>
{% endif %}
```

---

## How the Layouts Look

| Value | Description |
|---|---|
| `full_bar` | Full-width colour bar header (existing default) |
| `centred` | White background, title badge centred above business name |
| `split` | White background, business name left — title badge right |

---

## Testing Checklist

- [ ] Edit an invoice → set layout to **Full Bar** → download PDF → header is full colour bar
- [ ] Edit an invoice → set layout to **Centred** → download PDF → header is centred white layout
- [ ] Edit an invoice → set layout to **Split** → download PDF → header has left name / right badge
- [ ] Accent colour change is reflected in all three layouts
- [ ] If no `header_layout` is stored on the invoice, PDF falls back to `full_bar`

---

## Notes

- No frontend or database changes are needed — the `header_layout` field is already saved to the `invoices` table during `handleSave()`.
- No new dependencies required — Jinja2 conditionals are already supported by the template engine.
- The fix is purely additive; existing invoices without a saved `header_layout` will default to `full_bar`.
