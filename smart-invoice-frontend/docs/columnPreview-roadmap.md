# Column Preview Roadmap

This document outlines the strategy and plan for transforming the existing Invoice View page into a modern, two-column layout, separating the invoice rendering from actionable menu items.

## 1. Objective
Refactor the `InvoiceDetailPageContent` (located in `src/app/invoices/[id]/page.tsx`) specifically for the **View Mode**, without affecting the **Edit Mode** layout. The new view layout will feature:
*   **Left Column (Main Content):** The rendered invoice preview.
*   **Right Column (Actions Panel):** Contextual buttons, menus, and actions.
*   **Removal of Existing Top Section:** The "Invoice Details" card current displayed above the invoice preview will be entirely removed.

## 2. Requirements & Constraints
*   **No Code Generation Yet:** The instruction is to *plan* the changes only. The user will handle the actual implementation.
*   **Preserve Edit Mode:** The layout for creating/editing invoices must remain completely unchanged (the existing two-column form structure).
*   **Conditional "Send Receipt" Button:** A prominent action button that only appears if the invoice `status === 'Paid'`.
*   **Options Dropdown Menu:** A secondary action menu containing various invoice lifecycle options.
*   **Attach Files Section:** A dedicated area in the right column for attaching relevant documents to the invoice.

## 3. Structural Strategy

### 3.1 Layout Container
The parent container for the **View Mode** needs to transition from a stacked layout to a grid/flex layout responsive to screen sizes.

*   **Current Structure:**
    ```html
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>Invoice Details</Card>
      <InvoicePreview />
    </div>
    ```
*   **Target Structure:**
    ```html
    <!-- Expanded max-width to accommodate side-by-side layout comfortably -->
    <div className="max-w-5xl mx-auto">
      <!-- Grid layout for desktop, stacked on mobile -->
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Column 1: Left Side (takes up 2/3 width on desktop) -->
        <div className="lg:col-span-2">
            <!-- Render the invoice preview directly -->
            <InvoicePreview />
        </div>

        <!-- Column 2: Right Side (takes up 1/3 width on desktop) -->
        <div className="lg:col-span-1 flex flex-col gap-4">
             <!-- Action buttons and menus will live here -->
        </div>

      </div>
    </div>
    ```

### 3.2 Right Column Components Development

The right column should act as a sticky or scrollable sidebar (depending on content height) containing the following discrete elements:

#### Phase A: The Primary Action (Send Receipt)
*   **Component:** A standard full-width primary button.
*   **Logic:**
    ```javascript
    {invoice.status === 'Paid' && (
      <Button className="w-full bg-brand-600 ...">
        Send receipt
      </Button>
    )}
    ```
*   **Consideration:** What should display when the status is *not* "Paid"? (e.g., "Send Invoice"). This needs to be defined based on the application's intended workflow.

#### Phase B: The Options Dropdown Menu
*   **Component:** An integrated dropdown menu, likely built using an existing UI library component (e.g., Shadcn UI `DropdownMenu`).
*   **Trigger:** A button styled similarly to the design mockups (e.g., icon + "Options").
*   **Menu Items:**
    1.  Get a PDF
    2.  Get receipt PDF
    3.  Get share link
    4.  See client view
    5.  Revert to draft
    6.  Duplicate
    7.  Delete (Styled as a destructive/danger action)

#### Phase C: Attach Files Section
*   **Component:** A lightweight card or bordered container.
*   **Content:** UI for uploading files, or a placeholder if the backend file handling isn't ready. (e.g., "Attach files" label with a paperclip icon).

## 4. Implementation Steps (For the User)

**Step 1: Cleanup the View Mode**
*   Locate the `VIEW MODE` return block in `src/app/invoices/[id]/page.tsx`.
*   Delete the entire `<Card>` element that contains the `Invoice Details` header and data grid.

**Step 2: Setup the Grid Container**
*   Wrap the `<InvoicePreview />` in the new `grid` wrapper defined in section 3.1.
*   Create the empty right-hand column `<div>`.

**Step 3: Build the Right Column Skeleton**
*   Add the conditional "Send receipt" logic.
*   Construct the basic trigger for the "Options" menu.
*   Add the visual container for "Attach files".

**Step 4: Implement Dropdown Functionality**
*   Integrate the chosen `DropdownMenu` component.
*   Populate the specific list items. (Note: The actual click handlers for these actions, like generating PDFs or duplicating, will require corresponding frontend logic and backend API endpoints, which is outside the scope of this layout task).

**Step 5: Styling and Refinement**
*   Ensure identical padding and visual hierarchy as shown in the reference designs.
*   Test responsiveness: Ensure the grid stacks correctly on tablet/mobile views.
*   Verify that `EDIT MODE` remains untouched and functional.
