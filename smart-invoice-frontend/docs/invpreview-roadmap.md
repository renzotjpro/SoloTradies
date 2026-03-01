# Right-Hand Settings Sidebar & Invoice Editor Roadmap

## Overview
This roadmap outlines the steps to build a fixed-width vertical right sidebar for the invoice application, featuring a live reactive preview, tax settings with a dynamic GST toggle, branding controls, and updates to the main invoice form for Due Dates, Payment Details, and Footer Notes.

## Phase 1: Layout & Structure
**Goal:** Create the foundational right sidebar layout in the main invoice editor page.

*   **File:** `src/app/invoices/new/page.tsx`
*   **Tasks:**
    *   [ ] Locate the existing right sidebar section (Invoice Settings).
    *   [ ] Replace/Update it to be a fixed-width vertical right sidebar.
    *   [ ] Structure the sidebar into three distinct, vertically stacked sections:
        1.  **Preview**
        2.  **Branding & design**
        3.  **GST (Exclusive) and Attached files** (Tax Settings)

## Phase 2: The Preview Section
**Goal:** Display a live-updating miniature version of the invoice.

*   **File:** `src/app/invoices/new/page.tsx` / `src/app/settings/branding/components/InvoicePreview.tsx`
*   **Tasks:**
    *   [ ] Import the existing `InvoicePreview` component into the new **Preview** section.
    *   [ ] Wrap it in a scalable container (e.g., using CSS `transform: scale(...)` or a responsive wrapper) so it fits nicely and visibly inside the sidebar.
    *   [ ] Ensure `InvoicePreview` receives the current `BrandingContext` or form state, meaning any changes in Branding & Design or Tax Settings immediately reflect here.

## Phase 3: Tax Settings & Dynamic GST Toggle
**Goal:** Implement an inline GST toggle that recalculates invoice totals.

*   **File:** `src/app/invoices/new/page.tsx`
*   **Tasks:**
    *   [ ] Build an inline Segmented Control (two pill-shaped buttons) side-by-side inside the Tax Settings section. **Strictly no popups, modals, or dropdown menus.**
    *   [ ] Set the default selected state to **Exclusive**.
    *   [ ] Add a dynamic label above the toggle that displays exactly:
        *   `GST (Exclusive)` when Exclusive is active.
        *   `GST (Inclusive)` when Inclusive is active.
    *   [ ] **Global Tax State Integration:** Ensure this toggle updates the invoice calculation logic:
        *   **Exclusive:** `GST = Subtotal * 0.1` and `Total = Subtotal + GST`.
        *   **Inclusive:** `GST = Total - (Total / 1.1)` and the line item inputs represent the gross inclusive price.

## Phase 4: Branding & Design Integration
**Goal:** Provide branding controls below the preview.

*   **File:** `src/app/invoices/new/page.tsx`
*   **Tasks:**
    *   [ ] Render the existing branding design assets and controls (e.g., `BrandingSettingsPanel` or relevant context inputs) within the **Branding & design** section of the sidebar below the Preview.
    *   [ ] Verify that changing variables here updates the `InvoicePreview` correctly via context.

## Phase 5: Due Date Control Update
**Goal:** Replace the manual "Issue Date" with a smart "Due Date" dropdown.

*   **File:** `src/app/invoices/new/page.tsx`
*   **Tasks:**
    *   [ ] Change or remove the current `Issue Date` implementation as required.
    *   [ ] Update the `Due Date` input to be a `Select` dropdown with the following options:
        *   `14 days`
        *   `30 days`
        *   `45 days`
        *   `No due date`
        *   `Select date`
    *   [ ] Implement logic so selecting typical days calculates the exact date based on the current date.
    *   [ ] If `Select date` is chosen, render a standard Date Picker input. *(Note: Reminders will be implemented in the future).*

## Phase 6: Payment Details & Footer Notes
**Goal:** Add essential textual information fields to the invoice form.

*   **File:** `src/app/invoices/new/page.tsx`
*   **Tasks:**
    *   [ ] At the bottom of the left-hand main invoice form, add two `Textarea` fields: **Payment details** and **Footer notes**.
    *   [ ] Integrate these fields with the existing `BrandingContext` and global invoice settings.
    *   [ ] Ensure any text typed into these fields interacts smoothly with the live `InvoicePreview` component.

---
**Development Notes:** This plan focuses purely on integrating the invoice draft context with our branding state seamlessly. Keep performance in mind, as the `InvoicePreview` must instantly react to styling and tax recalculations without skipping a beat!
