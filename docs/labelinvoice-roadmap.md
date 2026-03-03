# Invoice Labels & Content Settings - Redesign Roadmap

## 1. Background & Current State
Currently, the "Content" tab in the Branding and Design settings suffers from a disconnected user experience:
- **Separation of Concerns:** Show/Hide toggles (e.g., "Quantity column") and their corresponding labels (e.g., changing "Quantity" to "Qty") are located in completely different sections of the UI.
- **Friction in Editing:** The current "Label Reference" listing forces the user to click "Edit on invoice →", navigating them away from the global settings panel to make changes.
- **Cognitive Load:** The accordion design hides information, and the list format doesn't map logically to how the invoice preview is structured visually.

## 2. Core Redesign Strategy
The goal is to create a seamless, intuitive, and "smart" settings panel that feels like a modern SaaS product, empowering the user to make global default changes instantly without leaving the page.

### Key Principles:
- **Anatomical Grouping:** Group settings logically by the physical sections of the invoice (Header, Client Info, Line Items, Totals) top-to-bottom. This aligns the right-hand settings panel mental model with the left-hand live preview.
- **Progressive Disclosure:** Hide text input fields for labels *until* their corresponding feature is toggled ON. This keeps the initial view clean and un-intimidating.
- **Inline Editing & Live Preview:** Replace "Edit on invoice" links with inline text inputs. Every keystroke should immediately update the live invoice preview on the left.
- **Smart Defaults:** Use dropdowns with common presets for standard fields (like Invoice Title) to reduce typing and prevent errors, falling back to a "Custom" text input when needed.

## 3. Proposed UI Structure (The "New Content Tab")

The new sidebar will be divided into the following visually distinct sections (e.g., separated by subtle dividers or card blocks):

### Section 1: Header & Document Info
Controls the top-level metadata of the invoice.
- **Invoice Title:** Dropdown (`Tax Invoice`, `Invoice`, `Quote`, `Custom...`) -> *If Custom: Show text input.*
- **Document Labels:**
  - Invoice Number Label: `[ Text Input (Default: Number) ]`
  - Issue Date Label: `[ Text Input (Default: Issued) ]`
  - Due Date Label: `[ Text Input (Default: Due) ]`
- **Show PO Number:** `[ Toggle ]`
  - *If ON -> show PO Number Label:* `[ Text Input (Default: PO Number) ]`

### Section 2: Client Information
Controls what customer details are displayed.
- **Bill To Label:** `[ Text Input (Default: To) ]`
- **Show Client Address:** `[ Toggle ]`
- **Show Client ABN/Tax ID:** `[ Toggle ]`
  - *If ON -> show Tax ID Label:* `[ Text Input (Default: ABN) ]` (Allows renaming to VAT, GST No., etc.)

### Section 3: Line Items Table
Controls the columns in the main pricing table.
- **Item Description Label:** `[ Text Input (Default: Description) ]`
- **Rate/Price Label:** `[ Text Input (Default: Rate) ]`
- **Show Quantity Column:** `[ Toggle ]`
  - *If ON -> show Quantity Label:* `[ Text Input (Default: QTY) ]`
- **Show Quantity Unit Type:** `[ Toggle ]` (e.g., Hour, Metre, Unit)

### Section 4: Totals & Summary
Controls the footer calculations and summaries.
- **Show Currency Prefix (AUD/USD):** `[ Toggle ]`
- **Show GST / Tax Breakdown:** `[ Toggle ]`
  - *If ON -> show Tax Label:* `[ Text Input (Default: GST) ]`
- **Show Discount Row:** `[ Toggle ]`
  - *If ON -> show Discount Label:* `[ Text Input (Default: Discount) ]`
- **Show Balance / Amount Due:** `[ Toggle ]`
  - *If ON -> show Balance Label:* `[ Text Input (Default: Amount Due) ]`

## 4. Implementation Action Plan

When ready to build, follow these phases:

### Phase 1: Data Model & State Preparation
1. Ensure the frontend global state/context (or form state) can handle all these label overrides and toggle booleans simultaneously.
2. Verify the backend API endpoint (`GET/PUT /api/branding` or similar) can save and retrieve these new custom labels and visibility flags.

### Phase 2: UI Component Construction (Right Panel)
1. Build the new `ContentSettingsTab` component.
2. Implement the UI groups (Header, Client, Table, Totals).
3. Create the smart `ToggleWithLabel` sub-component (handles the progressive disclosure animation/rendering).
4. Implement the Invoice Title dropdown logic.

### Phase 3: Live Preview Integration (Left Panel)
1. Pass the updated state values from the settings panel directly to the Invoice Preview component.
2. Ensure the preview maps the custom labels (e.g., if `customLabels.quantity` is "Hours", render "Hours" in the table header).
3. Ensure the preview respects the visibility toggles (e.g., if `toggles.showPoNumber` is false, hide the PO element entirely).

### Phase 4: Polish & Clean Up
1. Add subtle "Undo/Reset to Default" icons next to custom input fields.
2. Remove any old or redundant components (e.g., the old Accordion "Edit on invoice" list).
3. Test layout responsiveness and ensure the sidebar scrolls nicely on smaller screens.
