# Dynamic Invoice Template Rendering: Edit & Preview Roadmap

## 1. Objective
Ensure that branding selections (Accent Colour, Header Layout) chosen during invoice creation are saved directly to the individual invoice record, rather than just globally. This ensures that every generated invoice perfectly retains the styling it had at the moment it was created, while also providing instant visual feedback in the live preview during creation.

## 2. Phase 1: Database Updates
To persist invoice-level branding settings, the `invoices` table requires new columns so that each invoice holds its own snapshot of the branding.

**Action:** Execute the following SQL migration against the Supabase database:
```sql
ALTER TABLE invoices
ADD COLUMN accent_color VARCHAR(50),
ADD COLUMN header_layout VARCHAR(50);
```

## 3. Phase 2: Backend API & Model Updates
Update the FastAPI backend to accept, validate, and store these newly added fields.

**Actions:**
- **Update Pydantic Schemas (`app/schemas/schemas.py`)**: 
  - Add `accent_color: Optional[str] = None` and `header_layout: Optional[str] = None` to the `InvoiceCreate`, `InvoiceUpdate`, and the main `Invoice` response models.
- **Update CRUD logic (`app/crud/crud.py`)**: 
  - Modify `create_invoice()` to insert `accent_color` and `header_layout` into the new columns in the `invoices` table.
  - Modify `update_invoice()` to update these fields if they are provided in the payload update dictionary.

## 4. Phase 3: Frontend Data Transmission
Update the frontend form logic so that when a user saves or sends an invoice, their current branding choices in the sidebar panel are captured and sent to the API.

**Actions:**
- **Modify Invoice Creation Form (`src/app/invoices/new/page.tsx`)**:
  - In the `handleSave()` logic, access the current branding state from the `useBranding()` hook (e.g., `bs.colour_graphical` and `bs.header_layout`).
  - Include `accent_color` and `header_layout` in the JSON payload of the `POST /invoices/` fetch request.

## 5. Phase 4: Dynamic Invoice Preview Rendering
Update the component responsible for visually rendering the invoice (both for the creation preview and the final read-only view) to consume this data dynamically.

**Actions:**
- **Update Rendering Component (`src/app/settings/branding/components/InvoicePreview.tsx`)**:
  - Extend the `InvoiceData` TypeScript interface to include `accentColor?: string` and `headerLayout?: string`.
  - Modify the logic inside the component to explicitly prioritize the passed-in props (`invoiceData.accentColor`, `invoiceData.headerLayout`) over the global default variables accessed directly from the context/API.
  - Implement dynamic inline CSS styles for the 'TAX INVOICE' badge, table header row backgrounds, primary borders, and dividers to use this resolved accent color.
  - Implement conditional rendering or flexbox CSS to shift the header layout between 'Full' and 'Centred' based on the resolved layout variable.

## 6. Phase 5: View Invoice Page Mapping
Ensure that when viewing an already generated invoice, the database fields are correctly passed into the preview component.

**Actions:**
- **Update View Component** (e.g., `src/app/invoices/[id]/page.tsx` or similar):
  - When fetching the invoice data from the backend, map the DB `accent_color` and `header_layout` into the `invoiceData` prop being fed to `<InvoicePreview />`.

## 7. Phase 6: Verification & QA
Once the code is built, run these manual end-to-end checks to ensure success.

**Testing Steps:**
1. Create a new invoice. Change the brand color to "Green" and the layout to "Centred" inside the 'Branding & Design' sidebar.
2. Confirm the mini-preview updates instantly to Green and Centred.
3. Save the invoice.
4. Navigate to the main application Settings > Branding and change your global company color to "Red" and layout to "Full".
5. Navigate to your Invoices list and view the invoice you saved in step 3.
6. Verify that the viewed invoice is **still Green and Centred**, completely ignoring the new global "Red/Full" settings.
