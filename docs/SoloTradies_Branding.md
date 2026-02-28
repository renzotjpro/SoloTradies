# SoloTradies — Invoice Branding & Design Customisation Page (v2)

## Brief for Antigravity Development Team

**Project:** SoloTradies — AI-Powered Invoicing for Australian Tradespeople
**Feature:** Invoice Branding, Font, Design & Content Customisation
**Version:** 2.0 (Revised)
**Date:** 28 February 2026
**Prepared by:** Renzo Tello

---

## 1. Executive Summary

Build a **Branding & Design customisation page** where tradespeople personalise their invoice look and feel through a **live, interactive invoice preview** with direct inline editing capabilities. The key differentiator from competitors is that **the invoice preview IS the editor** — users click directly on any label, text, or section in the preview to edit it, eliminating the disconnect between "settings panel" and "output."

### What Makes This Different From Competitors

Most invoicing tools (Invoice Ninja, Xero, MYOB) use a **two-panel approach** where you edit fields in a sidebar and see changes reflected in a separate preview. This creates cognitive overhead — the user has to mentally map "which field changes which part of the invoice."

**Our approach: The invoice itself is the editor.** Click on "Subtotal" on the invoice → edit it to "Sub Total Amount" right there. Click on "PAYMENT DETAILS" → rename it to "HOW TO PAY." This is how Canva and Figma work, and it's why they're loved by non-designers.

---

## 2. Target Users & Context

- **Primary users:** Solo tradespeople in Australia (plumbers, electricians, builders, painters, landscapers)
- **Technical level:** Low to moderate — the UI must be visual and intuitive, not form-heavy
- **Device usage:** Primarily mobile (on-site) and tablet, with desktop for office work
- **Key insight:** Tradies don't want to learn software. They want to see their invoice, tap the bit they want to change, change it, and move on

---

## 3. Page Architecture

### 3.1 Overall Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Branding and design                              [Save] [↗] │
├───────────────────────────────────┬─────────────────────────────┤
│                                   │  🎨    𝐓    🖼    📝        │
│                                   │ Brand  Font  Design Content │
│   ┌───────────────────────────┐   ├─────────────────────────────┤
│   │                           │   │                             │
│   │   LIVE INVOICE PREVIEW    │   │   Tab-specific settings     │
│   │                           │   │                             │
│   │   ✏️ Click any text to    │   │   (Contextual — changes     │
│   │      edit directly        │   │    based on what user       │
│   │                           │   │    clicked in preview)      │
│   │   🎨 Click any colour     │   │                             │
│   │      area to change it    │   │                             │
│   │                           │   │                             │
│   └───────────────────────────┘   │                             │
│                                   │                             │
│   [📄 Download Sample PDF]        │                             │
├───────────────────────────────────┴─────────────────────────────┤
│                    Auto-saved ✓ 2 seconds ago                   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 The Big Idea: Two Editing Modes Working Together

| Mode | How It Works | When It's Used |
|---|---|---|
| **Direct inline editing** | User clicks on any editable element directly on the invoice preview. A subtle edit cursor appears, and the text becomes editable in-place | Renaming labels ("Subtotal" → "Sub Total Amount"), editing footer messages, changing payment details text |
| **Settings panel** (right side) | Traditional form controls for settings that can't be "clicked" on a preview | Logo upload, colour pickers, font selection, template switching, toggles (show/hide sections) |

**The magic:** When a user clicks an editable element on the invoice, the right panel **contextually scrolls** to show related settings. For example, clicking the header area of the invoice auto-switches to the Brand tab and highlights the relevant fields.

---

## 4. Interactive Invoice Preview (Left Panel) — The Core Innovation

### 4.1 Editable Elements on the Invoice

Every text element on the invoice preview should have **three visual states:**

| State | Visual Treatment |
|---|---|
| **Default** | Normal text, no indication it's editable |
| **Hover** | Subtle blue dotted border + pencil icon appears to the right. Cursor changes to text cursor. Background becomes very light blue (#F0F7FF) |
| **Editing** | Text becomes an inline text field with a visible border. A small floating toolbar appears above with: font size, bold/italic, and "Reset to default" |

### 4.2 Editable Regions Map

```
┌──────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓ HEADER BAR (click to change colour)
├──────────────────────────────────────────────────┤
│ [✏️ Renzo Tello]              [TAX INVOICE]      │ ← Click to edit business name
│ [✏️ renzotj@gmail.com]        [✏️ Jane Appleseed]│ ← Click to edit email / client placeholder
│ [✏️ ABN: 51 525 585 585]   [✏️ To ACME Pty Ltd] │ ← ABN editable but validated
│                                                  │
│                     [✏️ Number]    1234567        │ ← Click "Number" to rename label
│                     [✏️ Issued]    28 Feb, 2026   │ ← Click "Issued" to rename label
│                     [✏️ Due]       28 Feb, 2026   │
│                     [✏️ Total]     $45.00         │
│                                                  │
│ [✏️ DESCRIPTION]  [✏️ QTY] [✏️ RATE] [✏️ GST] [✏️ TOTAL]
│──────────────────────────────────────────────────│
│    1 Unit     $45.00   $4.09   $45.00            │
│                                                  │
│                     [✏️ Subtotal]      $45.00     │ ← CLICK → rename to "Sub Total Amount"
│                     [✏️ GST]            $4.09     │ ← CLICK → rename to "Tax (GST 10%)"
│                     [✏️ Total]         $45.00     │
│                                                  │
│ [✏️ PAYMENT DETAILS]                             │ ← CLICK → rename to "HOW TO PAY"
│──────────────────────────────────────────────────│
│ [✏️ Please make payments via direct deposit...] │ ← CLICK → edit full payment text block
│                                                  │
│ [✏️ Thank you for your business...]              │ ← CLICK → edit footer message
└──────────────────────────────────────────────────┘
```

### 4.3 Non-Editable Elements (Display Only in Preview)

These elements use **dummy/sample data** and are not editable because they come from real invoice data at creation time:

- Invoice number value (e.g., "1234567")
- Date values (e.g., "28 Feb, 2026")
- Dollar amounts ($45.00, $4.09)
- Line item description and quantities
- Client name and address (sample data)

A subtle tooltip on hover for these: "This data comes from your actual invoices"

### 4.4 Colour-Editable Areas

Some areas on the invoice respond to **colour clicks** instead of text editing:

| Area | Click Behaviour |
|---|---|
| Header bar (top colour strip) | Opens a colour picker popover anchored to that area |
| Table header row background | Opens colour picker for table accent colour |
| Section divider lines | Opens colour picker for line colour |
| "TAX INVOICE" text | Opens colour picker for heading text colour |

These colour edits sync with the Brand tab's colour settings bidirectionally.

---

## 5. Configuration Tabs (Right Panel)

### 5.1 Brand Tab 🎨

| Field | Type | Details |
|---|---|---|
| **Business logo** | Upload zone | Drag-and-drop area. Accept PNG, JPG, SVG (max 5MB). Show thumbnail + "Remove" after upload. Recommend minimum 400px wide |
| **Header image** | Upload zone | Optional banner. Recommend 1600px wide. Show dimension guidance text |
| **Your name** | Text input | Pre-populated from profile. Synced with invoice preview (edit either place) |
| **Business name** | Text input | Trading name. Synced with preview |
| **Address** | Textarea | Business address |
| **Phone number** | Text input | Contact number |
| **Email address** | Text input | Pre-populated from account |
| **ABN** | Text input | Pre-populated. Format validated: XX XXX XXX XXX. Locked indicator: "Required on Australian tax invoices" |
| **Brand colours** | Two colour pickers side by side | **Text colour** — headings, labels, accent text. **Graphical colour** — header bar, borders, table headers. Each with: hex input, visual picker, recent colours, and 6 preset palettes for tradies (e.g., "Tradie Blue", "Safety Orange", "Forest Green") |

**Smart suggestion — Preset colour palettes for trades:**

| Palette Name | Text Colour | Graphical Colour | Best For |
|---|---|---|---|
| Professional Blue | #1A365D | #3182CE | Plumbers, electricians |
| Safety Orange | #2D3748 | #DD6B20 | Builders, civil |
| Forest Green | #1A3A1A | #38A169 | Landscapers, arborists |
| Clean Slate | #333333 | #718096 | General trades |
| Brick Red | #2D1B1B | #C53030 | Bricklayers, roofers |
| Golden Pro | #2D2006 | #D69E2E | Premium services |

### 5.2 Font Tab 𝐓

| Field | Type | Details |
|---|---|---|
| **Choose font** | Dropdown with preview | Each option shows the font name rendered in that font. Fonts: Roboto, Inter, Open Sans, Lato, Poppins, Nunito, Merriweather, Playfair Display |
| **Font size** | Dropdown | Regular / Large / Extra Large. Affects base body text; headings scale proportionally. Show a preview sentence below: "The quick brown fox jumps over the lazy dog" rendered in the selected font + size |

**Smart suggestion — Font pairing preview:**
Instead of just a font name dropdown, show a **mini invoice snippet** for each font option so the user can see how it looks on an invoice layout, not just as a single line of text. This is much more useful for visual decision-making.

### 5.3 Design Tab 🖼

| Section | Type | Details |
|---|---|---|
| **Header layout** | Visual grid (3 options) | Clickable thumbnail cards showing: (1) Full-width bar with logo left, (2) Centred logo with info below, (3) Split layout — logo left, details right. Show a blue "selected" ring around the active choice |
| **Footer layout** | Visual grid (2 options) | (1) Payment details full-width block, (2) Payment details in two columns (details left, bank info right) |
| **Table style** | Visual grid (3-4 options) | (1) Bordered with header shading, (2) Striped alternating rows, (3) Minimal — horizontal lines only, (4) Clean — no borders, just spacing |
| **Logo position** | Visual grid (3 options) | Top-left / Top-centre / Top-right (shown as mini layout thumbnails) |

**Smart suggestion — Template quick-starts:**
Add a **"Start from a template"** button at the top of the Design tab that opens a modal with 4-6 full invoice template previews. Clicking one applies all design settings at once (header layout, footer layout, table style, colours, font). The user can then fine-tune from there. Templates could be named: "Classic Professional", "Modern Minimal", "Bold & Bright", "Compact", "Detailed Trades".

### 5.4 Content Tab 📝 — REIMAGINED

This is where the biggest improvement happens. Instead of the traditional approach (Image 3 in screenshots) with a long list of label text fields in the sidebar, we use **the inline editing on the invoice preview as the primary editing method** for labels.

The Content tab in the sidebar handles **toggles and visibility settings only:**

#### Show/Hide Toggles

| Toggle | Default | Details |
|---|---|---|
| **Client address** | OFF | Show client's address on invoice |
| **Client business number** | OFF | Show client's ABN (optional — most residential clients don't have one) |
| **Line item quantity column** | ON | Show the "Quantity" column in the items table |
| **Line item quantity type** | ON | Show unit type (e.g., "Unit", "Hour", "Metre") |
| **Currency in total** | OFF | Show "$AUD" prefix instead of just "$" |
| **GST breakdown** | ON | Show Subtotal + GST + Total (vs just Total). Warning if turned OFF: "GST breakdown is required on tax invoices over $82.50" |
| **Discount row** | OFF | Show a discount line in totals |
| **Surcharge row** | OFF | Show a surcharge line in totals |
| **Balance / Amount Due** | ON | Show remaining balance (useful for partial payments) |
| **PO Number field** | OFF | Show Purchase Order number in header |
| **Deposit Due Date** | OFF | Show deposit due date |
| **Payment details section** | ON | Show the bank details / payment section |
| **Footer message** | ON | Show the "Thank you" footer |
| **Terms & conditions** | OFF | Show a T&C block at the bottom |

#### Collapsible Label Reference Sections

Below the toggles, show **read-only reference sections** (collapsed by default) that list all current label values. Each label has a small "Edit on invoice →" link that scrolls the preview to that element and activates inline editing:

**▸ Header Labels** (collapsed)
```
Bill to ............... "To"          [Edit on invoice →]
Invoice Number ........ "Number"      [Edit on invoice →]
PO Number ............. "PO Number"   [Edit on invoice →]
Issued Date ........... "Issued"      [Edit on invoice →]
Due Date .............. "Due"         [Edit on invoice →]
Total ................. "Total"       [Edit on invoice →]
```

**▸ Table Labels** (collapsed)
```
Description ........... "Description" [Edit on invoice →]
Quantity .............. "Quantity"     [Edit on invoice →]
Rate .................. "Rate"        [Edit on invoice →]
GST ................... "GST"         [Edit on invoice →]
Total ................. "Total"       [Edit on invoice →]
```

**▸ Total Labels** (collapsed)
```
Subtotal .............. "Subtotal"    [Edit on invoice →]
GST ................... "GST"         [Edit on invoice →]
Discount .............. "Discount"    [Edit on invoice →]
Grand Total ........... "Total"       [Edit on invoice →]
```

**▸ Payment Labels** (collapsed)
```
Details heading ....... "Payment Details"     [Edit on invoice →]
Received heading ...... "Payments Received"   [Edit on invoice →]
```

This approach means:
1. **The sidebar is clean** — mostly toggles, not 25+ text fields
2. **Editing happens where it makes sense** — on the actual invoice
3. **Users can still find what to edit** — the reference sections provide a "map" of all editable labels

---

## 6. Inline Editing — Technical Specification

### 6.1 Edit Interaction Flow

```
User hovers over "Subtotal" on invoice
    ↓
Visual feedback: dotted border + light blue background + ✏️ icon
    ↓
User clicks
    ↓
Text becomes an editable input field (in-place, same position and size)
Right panel scrolls to show related section (Total Labels)
    ↓
User types "Sub Total Amount"
    ↓
Input auto-resizes to fit content
Preview layout adjusts in real-time
    ↓
User clicks away (or presses Enter)
    ↓
Change is saved. Label reference in sidebar updates to reflect new value
"Auto-saved ✓" indicator pulses briefly
    ↓
A small "↺ Reset" link appears next to the label (on hover) to revert to default
```

### 6.2 Floating Mini-Toolbar

When a text element is being edited, a small floating toolbar appears **above** the element:

```
┌──────────────────────────────────────┐
│  B  I  U  │  Aa▾  │  ↺ Reset default │
└──────────────────────────────────────┘
         ↕
┌──────────────────────────────────────┐
│  Sub Total Amount                    │  ← inline editable text
└──────────────────────────────────────┘
```

Toolbar options:
- **B** / **I** / **U** — Bold, Italic, Underline (for content blocks like footer message)
- **Aa▾** — Text transform: UPPERCASE, Title Case, lowercase
- **↺ Reset default** — Revert label to its original value

For **short labels** (like "Subtotal"), only show the text transform + reset options. The full toolbar is for **long text blocks** (footer message, payment details, T&C).

### 6.3 Smart Defaults & Placeholders

When a new user first visits the page, all labels have sensible Australian defaults:

| Element | Default Value |
|---|---|
| Invoice title | "TAX INVOICE" |
| Bill to prefix | "To" |
| Number label | "Number" |
| Issued label | "Issued" |
| Due label | "Due" |
| Description | "Description" |
| Quantity | "Quantity" |
| Rate | "Rate" |
| GST | "GST" |
| Total (column) | "Total" |
| Subtotal | "Subtotal" |
| GST (totals) | "GST" |
| Grand total | "Total" |
| Payment heading | "PAYMENT DETAILS" |
| Footer | "Thank you for your business.\nI'm looking forward to working with you again in the future." |

---

## 7. Smart Suggestions — Features That Go Beyond Competitors

### 7.1 AI-Assisted Branding Setup (SoloTradies Differentiator)

Since SoloTradies already has an AI chat interface, we can offer:

> **"Set up my branding"** — User tells the AI: "I'm a plumber in Sydney, my business is called BlueFlow Plumbing" → the AI suggests colours (blue palette), generates a footer message, and pre-fills brand settings. User approves or tweaks.

This could be a **floating AI assistant button** on the branding page: 🤖 "Need help setting up?"

### 7.2 Trade-Specific Templates

Instead of generic "Modern" / "Classic" templates, offer templates named for trades:

| Template | Optimised For | Key Features |
|---|---|---|
| **Tradie Classic** | General trades | Clean, professional, works for everything |
| **Hourly Pro** | Electricians, plumbers | Emphasises hourly rates and labour breakdown |
| **Project Builder** | Builders, renovators | Multiple line item groups, deposit tracking, progress payments |
| **Quick Job** | Emergency call-outs | Compact, single-service, fast to read |
| **Materials + Labour** | Painters, landscapers | Split sections for materials and labour |

### 7.3 Live Preview Device Toggle

Add three small icons below the invoice preview:

```
[🖥 Desktop]  [📱 Mobile]  [🖨 Print]
```

This lets the user see how their invoice looks in different contexts:
- **Desktop** — Full-size preview (default)
- **Mobile** — How it renders when a client opens the emailed PDF on their phone
- **Print** — Greyscale version showing how it looks when printed (important — many tradies print invoices on-site)

### 7.4 "Undo History" Sidebar

A small clock icon (🕐) in the top-right of the preview that opens a timeline of recent changes:

```
🕐 Change History
  • Changed "Subtotal" → "Sub Total Amount" (2 min ago) [Undo]
  • Changed header colour to #3182CE (5 min ago) [Undo]
  • Uploaded new logo (12 min ago) [Undo]
  • Switched to "Modern Minimal" template (15 min ago) [Undo]
```

### 7.5 One-Tap "Make It Professional" Button

For users who don't want to customise anything, offer a prominent button:

> ✨ **Make My Invoice Professional** — Automatically applies a polished template based on the user's trade type, uses their business colours (if they have a logo, extract dominant colours from it), and sets up standard Australian payment terms.

This is powered by the AI and uses the business profile information the user already provided during onboarding.

---

## 8. Mobile Experience

### 8.1 Mobile Layout

On mobile, the split-screen collapses into a **single panel with a toggle:**

```
┌─────────────────────────┐
│ ← Branding and design   │
├─────────────────────────┤
│  [👁 Preview] [⚙ Edit]  │  ← Toggle between modes
├─────────────────────────┤
│                         │
│  (When Preview mode):   │
│  Full-width invoice     │
│  with inline editing    │
│  active. Tap any text   │
│  to edit.               │
│                         │
│  (When Edit mode):      │
│  Full-width settings    │
│  panel with all 4 tabs  │
│                         │
├─────────────────────────┤
│  [📄 Download PDF]      │
└─────────────────────────┘
```

### 8.2 Mobile Inline Editing

- **Tap** on a label → the label becomes editable with the native keyboard appearing
- The floating toolbar appears as a **fixed bar above the keyboard** (like the formatting bar in iOS Notes)
- **Long press** on a colour area → colour picker appears as a bottom sheet
- **Pinch to zoom** on the invoice preview for fine control

---

## 9. Data Model

### 9.1 Branding Settings Table

```sql
CREATE TABLE invoice_branding_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Brand
    logo_url VARCHAR(500),
    header_image_url VARCHAR(500),
    display_name VARCHAR(200),
    business_name VARCHAR(200),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(200),
    abn VARCHAR(14) NOT NULL,  -- Stored as "XX XXX XXX XXX"
    colour_text VARCHAR(7) DEFAULT '#333333',
    colour_graphical VARCHAR(7) DEFAULT '#C0392B',

    -- Font
    font_family VARCHAR(50) DEFAULT 'Roboto',
    font_size VARCHAR(20) DEFAULT 'regular',  -- regular, large, extra_large

    -- Design
    template_id VARCHAR(50) DEFAULT 'tradie_classic',
    header_layout VARCHAR(30) DEFAULT 'full_bar',  -- full_bar, centred, split
    footer_layout VARCHAR(30) DEFAULT 'full_width', -- full_width, two_column
    table_style VARCHAR(30) DEFAULT 'bordered',    -- bordered, striped, minimal, clean
    logo_position VARCHAR(20) DEFAULT 'top_left',  -- top_left, top_centre, top_right

    -- Content: Visibility Toggles
    show_client_address BOOLEAN DEFAULT FALSE,
    show_client_abn BOOLEAN DEFAULT FALSE,
    show_quantity_column BOOLEAN DEFAULT TRUE,
    show_quantity_type BOOLEAN DEFAULT TRUE,
    show_currency_prefix BOOLEAN DEFAULT FALSE,
    show_gst_breakdown BOOLEAN DEFAULT TRUE,
    show_discount_row BOOLEAN DEFAULT FALSE,
    show_surcharge_row BOOLEAN DEFAULT FALSE,
    show_balance_due BOOLEAN DEFAULT TRUE,
    show_po_number BOOLEAN DEFAULT FALSE,
    show_deposit_due_date BOOLEAN DEFAULT FALSE,
    show_payment_details BOOLEAN DEFAULT TRUE,
    show_footer_message BOOLEAN DEFAULT TRUE,
    show_terms_conditions BOOLEAN DEFAULT FALSE,

    -- Content: Payment & Messages
    payment_details TEXT DEFAULT 'Please make payments via direct deposit to:\nAcc Name: \nBSB: \nAcc No: ',
    payment_terms VARCHAR(20) DEFAULT '14_days',
    footer_message TEXT DEFAULT 'Thank you for your business.\nI''m looking forward to working with you again in the future.',
    terms_conditions TEXT,
    invoice_prefix VARCHAR(10),
    default_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_user_branding UNIQUE (user_id)
);
```

### 9.2 Custom Labels Table (Separate for Cleanliness)

```sql
CREATE TABLE invoice_custom_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label_key VARCHAR(50) NOT NULL,   -- e.g., 'subtotal', 'gst_total', 'description'
    label_value VARCHAR(100) NOT NULL, -- e.g., 'Sub Total Amount'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_user_label UNIQUE (user_id, label_key)
);

-- Default label keys:
-- Header: invoice_title, bill_to, invoice_number, po_number, issued_date, due_date, deposit_due_date, header_total
-- Table: description, quantity, rate, gst_column, total_column, view_receipt
-- Totals: subtotal, gst_total, discount, surcharge, balance, amount_due, grand_total
-- Payment: payment_heading, received_heading, online_button
```

### 9.3 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/branding` | Fetch branding settings + all custom labels |
| PUT | `/api/v1/branding` | Update branding settings (toggles, design choices) |
| POST | `/api/v1/branding/logo` | Upload logo image |
| POST | `/api/v1/branding/header-image` | Upload header image |
| DELETE | `/api/v1/branding/logo` | Remove logo |
| DELETE | `/api/v1/branding/header-image` | Remove header image |
| PUT | `/api/v1/branding/labels` | Batch update custom labels (send all changed labels at once) |
| PUT | `/api/v1/branding/labels/{key}` | Update single label |
| DELETE | `/api/v1/branding/labels/{key}` | Reset single label to default |
| GET | `/api/v1/branding/preview-pdf` | Generate sample PDF with current settings |
| GET | `/api/v1/branding/templates` | List available invoice templates with thumbnail URLs |
| POST | `/api/v1/branding/ai-setup` | AI-assisted branding setup (send trade type → receive suggested settings) |

---

## 10. Australian Compliance (Non-Negotiable)

1. **ABN must always display** on invoices — UI shows it as a locked/required field
2. **GST breakdown required** on tax invoices for goods/services over $82.50 (GST-inclusive). Show warning toast if user turns off the GST toggle
3. **"Tax Invoice" label** must appear when GST is charged — the invoice title label defaults to "TAX INVOICE" and shows a compliance warning if changed to something that removes the tax invoice designation
4. **Supplier details** (name, ABN, address) are mandatory
5. **Date and invoice number** must always be present
6. **Client ABN is optional** — most residential customers don't have one. This toggle defaults to OFF

---

## 11. Technical Considerations

### 11.1 Auto-Save Strategy

- **Debounce text inputs:** 800ms after last keystroke
- **Immediate save for:** toggle changes, colour picks, template selection, logo upload
- **Save indicator:** "Auto-saved ✓" text that appears briefly after each save, then fades
- **Conflict handling:** Last-write-wins (single user, not collaborative)
- **Offline:** Queue changes locally, sync when online (important for tradies on construction sites with poor connectivity)

### 11.2 Live Preview Rendering

- The preview component must be a **shared React component** used both in the branding page AND in the actual PDF generation pipeline
- This ensures WYSIWYG — what the user sees in the preview is exactly what the PDF looks like
- Consider using a headless rendering approach (e.g., Puppeteer/Playwright) for PDF generation from the same component

### 11.3 Image Handling

- Upload to CloudFlare R2 or S3
- Generate thumbnails (200px width) for settings panel display
- Validate: max 5MB, PNG/JPG/SVG only
- Extract dominant colours from logo for the "Make It Professional" AI feature
- Compress for PDF embedding (target: <200KB per image in PDF)

### 11.4 Performance Targets

| Metric | Target |
|---|---|
| Preview update after change | < 150ms |
| Page initial load | < 2 seconds |
| Logo upload + preview update | < 3 seconds |
| PDF generation | < 5 seconds |
| Auto-save round trip | < 1 second |

---

## 12. Acceptance Criteria

### Brand Tab
- [ ] User can upload, preview, and remove a business logo
- [ ] User can upload, preview, and remove a header image
- [ ] All brand fields (name, business, address, phone, email) are editable and sync with preview
- [ ] ABN is displayed, validated (11 digits), and cannot be hidden
- [ ] Two colour pickers work with hex input, visual picker, and preset palettes
- [ ] Preset trade colour palettes are available and apply correctly

### Font Tab
- [ ] Font dropdown shows each font rendered in its own typeface
- [ ] Font size options (Regular/Large/Extra Large) update preview correctly
- [ ] Preview text renders below the selector in the chosen font

### Design Tab
- [ ] At least 3 header layout options with visual thumbnails
- [ ] At least 2 footer layout options with visual thumbnails
- [ ] At least 3 table styles with visual differentiation
- [ ] Logo position options (left/centre/right) work correctly
- [ ] All design changes reflect immediately in preview

### Content Tab
- [ ] All show/hide toggles work and update preview in real-time
- [ ] GST toggle shows compliance warning when turned OFF
- [ ] Label reference sections show current values and "Edit on invoice" links work
- [ ] Toggling a section OFF removes it from the preview; ON restores it

### Inline Editing
- [ ] Hovering over editable elements shows visual feedback (border + icon)
- [ ] Clicking an editable element activates inline text editing
- [ ] Floating toolbar appears with appropriate options
- [ ] "Reset to default" reverts the label correctly
- [ ] Clicking away saves the change and deactivates editing
- [ ] Changes sync between inline edit and sidebar label reference

### General
- [ ] All changes auto-save with visual confirmation
- [ ] "Download Sample PDF" generates an accurate PDF matching the preview
- [ ] Page is fully responsive (desktop, tablet, mobile)
- [ ] Default settings produce a professional-looking invoice with zero customisation
- [ ] Mobile toggle between Preview and Edit modes works smoothly
- [ ] Undo history tracks and can revert recent changes
- [ ] Settings persist across sessions and apply to all new invoices

---

## 13. Out of Scope (Future Phases)

- Multiple branding profiles per user
- Custom HTML/CSS template editor
- Template marketplace
- Email template customisation
- Multi-currency support (AUD only)
- Quote/estimate-specific templates
- Collaborative branding (teams)
- AI logo generation

---

## 14. Priority & Phasing Recommendation

### Phase 1 (MVP) — 4-6 weeks
- Brand tab (all fields + logo upload)
- Font tab (font family + size)
- Design tab (3 header layouts, 2 footer layouts, 3 table styles)
- Content tab (toggles only, no inline editing yet — use sidebar text fields as fallback)
- Live preview (real-time updates, but no inline editing)
- Auto-save
- PDF download

### Phase 2 (Differentiator) — 3-4 weeks
- Inline editing on invoice preview (all editable labels)
- Floating mini-toolbar
- "Edit on invoice →" links from sidebar
- Contextual panel highlighting (click preview → sidebar scrolls)
- Mobile-optimised layout
- Undo history

### Phase 3 (AI-Powered) — 2-3 weeks
- "Make It Professional" one-tap setup
- AI-assisted branding via chat
- Trade-specific templates
- Logo colour extraction for auto-palette
- Device preview toggle (desktop/mobile/print)

---

## 15. Reference Screenshots

Four screenshots have been provided showing a competitor's implementation:
1. **Brand tab** — Logo upload, name fields, colour pickers
2. **Font tab** — Font family dropdown, font size dropdown
3. **Design tab** — Header layout thumbnails, footer layout thumbnails
4. **Content tab** — Show/hide toggles + extensive label editing fields

Our implementation improves on this by making the invoice preview interactive and editable, reducing the Content tab's complexity, and adding AI-powered features specific to Australian tradespeople.
