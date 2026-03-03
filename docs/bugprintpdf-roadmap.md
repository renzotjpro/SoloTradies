# Bug Fix Roadmap — PDF Print Text Colour

**Status:** Open  
**Reported:** 03 Mar 2026  
**Priority:** Medium  

---

## Problem Summary

The invoice **preview** (React frontend) correctly applies the user's selected **Text Colour** from branding settings to the header section (business name, TAX INVOICE title, sub-details like ABN, phone, email, address).

However, the **generated PDF** still uses hardcoded white (`#ffffff`) for all header text, completely ignoring the `colour_text` branding setting.

This is because the preview and the PDF are **two entirely separate rendering systems**:

| Layer | Technology | Status |
|---|---|---|
| Invoice Preview | React (`InvoicePreview.tsx`) | ✅ Fixed (03 Mar 2026) |
| PDF Generation | Python + WeasyPrint (`invoice.html`) | ❌ Still hardcoded white |

---

## Root Cause

### File 1 — `pdf_generator.py`

The `ctx` dictionary passed to the Jinja2 template does **not** include `text_color`. Even if the template is updated, it will not receive the value.

```python
# Missing from ctx:
"text_color": invoice_data.get("colour_text") or "#ffffff",
```

### File 2 — `invoice.html` (Jinja2 template)

The header CSS classes have hardcoded white colours:

| CSS Class | Property | Current Value | Should Be |
|---|---|---|---|
| `.header-left .business-name` | `color` | `#ffffff` | `{{ text_color }}` |
| `.header-left .business-meta` | `color` | `rgba(255,255,255,0.75)` | `{{ text_color }}` at 70% opacity |
| `.header-right .invoice-title` | `color` | `#ffffff` | `{{ text_color }}` |

---

## Fix Plan

### Step 1 — `pdf_generator.py`

Add `text_color` to the `ctx` dictionary so it is passed to the template:

```python
"text_color": invoice_data.get("colour_text") or "#ffffff",
```

> Pull `colour_text` from the merged branding+invoice data. Default to `"#ffffff"` so existing PDFs with no branding setting are unaffected.

### Step 2 — `invoice.html`

Update the three header CSS rules to use the dynamic value:

```css
/* BEFORE */
.header-left .business-name {
  color: #ffffff;
}
.header-left .business-meta {
  color: rgba(255, 255, 255, 0.75);
}
.header-right .invoice-title {
  color: #ffffff;
}

/* AFTER */
.header-left .business-name {
  color: {{ text_color }};
}
.header-left .business-meta {
  color: {{ text_color }};
  opacity: 0.7;
}
.header-right .invoice-title {
  color: {{ text_color }};
}
```

---

## Verification Plan

1. Set `Text Colour` to `#1a1a1a` (near-black) in Branding & Design settings
2. Generate a PDF for any invoice
3. Confirm "Solo Tradies Australia" and "TAX INVOICE" render in `#1a1a1a` on the green header bar
4. Confirm ABN / phone / email sub-details render in `#1a1a1a` at reduced opacity
5. Change `Text Colour` to white (`#ffffff`) and regenerate — verify text returns to white
6. Confirm no visual regression on `centred` or `split` header layouts (those are unaffected)

---

## Files Affected

| File | Change Type |
|---|---|
| `smart-invoice-backend/app/utils/pdf_generator.py` | Add `text_color` to `ctx` dict |
| `smart-invoice-backend/app/templates/invoice.html` | Replace hardcoded white with `{{ text_color }}` |

---

## Notes

- The `colour_text` value must be present in the branding data merged into `invoice_data` before `generate_invoice_pdf()` is called. Confirm the merge logic in `app/api/invoices.py` includes branding fields.
- The fix applies only to the `full_bar` header layout. The `centred` and `split` layouts in the HTML template use inline styles and may need a separate review pass.
