# Smart Invoice - Manual Invoice Roadmap

This document outlines the implementation strategy, design structure, and feature breakdown for building the Manual Invoice Creation page matching the required Australian ATO standards (10% GST).

## 1. Page Implementation Path
I recommend building this page at `src/app/invoice/new/page.tsx` so that it doesn't overwrite your conversational AI interface currently found at `src/app/create/page.tsx`.

## 2. Layout Structure
The UI is divided into two primary sections matching the provided design:
- **Left Main Card**: The core invoice data entry form.
- **Right Sidebar SettingsCard**: The auxiliary controls to customize the invoice context.

The overarching layout should utilize a grid or flex structure allowing the sidebar to stay fixed while the main content scrolls, or stack responsively on smaller screens.

## 3. Component Breakdown

### Left Form Components
1. **Header Component**:
   - Company Logo placeholder (purple icon)
   - Business Information (Name, Address)
   - Invoice Identification Details (Invoice Number auto-generated, Issue Date Picker)

2. **Client & Meta Component**:
   - "Bill to" Client Selector Dropdown
   - Notes to Customer Text Input
   - Due Date Selectors (e.g., "7 days later", specific Date Picker).

3. **Invoice Items Table Component**:
   - Dynamic List of Line Items:
     - Includes: Product Name/Service, Quantity (with unit: hour, item), Price, VAT/GST Selector (Locked/Defaulted to 10% GST in Australia), and Line Total.
   - Action Buttons: Add Item (Blue text button), Remove Item (Trash icon to delete row).

4. **Totals Component**:
   - Subtotal calculation (Sum of (Qty * Price)).
   - Tax/GST calculation (10% of Subtotal).
   - Total Amount (Subtotal + GST).

### Right Sidebar Components
1. **Invoice Settings List**:
   - **Customize Invoice**: Trigger modal/dropdown for custom templates.
   - **Online Payment Settings**: Toggle Switch (ON/OFF).
   - **Recurring Invoice**: Toggle Switch (ON/OFF) and Frequency Dropdown.
   - **Currency Settings**: Defaulted to AUD ($) or USD depending on preference, with a selector.
   - **Set Reminders**: Toggle Switch (ON/OFF).
   - **General Settings**: Link to full business settings.

## 4. State Management (React Logic)
For handling complex form state, React `useState` hooks are essential:
- `items`: State array managing objects like `{ id, description, qty, unit, price, taxPct, total }`.
- Derived totals should be calculated directly from the `items` array on every render cycle to prevent mismatching data (e.g., `const subtotal = items.reduce(...)`).
- Tax should strictly compute as exactly `0.10 * subtotal`.

## 5. Styling Guidelines (Tailwind CSS)
To achieve the premium aesthetic seen in the design:
- **Colors**: Use crisp whites (`bg-white`) for cards, offset by soft gray backgrounds for the page (`bg-gray-50/50`).
- **Accents**: Utilize the signature electric blue for primary buttons (`bg-blue-600` or `#2563EB`) and soft purple/violet (`#A855F7`) for highlighting specific graphics (like the logo border).
- **Typography**: Keep inputs clean using minimal borders (`border border-gray-200`) and rounded corners (`rounded-xl` or `rounded-2xl`). Soft grays for helper text and bold blacks for numbers.
- **Micro-animations**: Implement `transition-colors` and `hover:bg-gray-50` on table rows and buttons for responsiveness.

## 6. Validation & Business Logic Requirements
- Ensure line subtotals dynamically update immediately when Qty or Price changes.
- Ensure GST is transparently displayed as exactly 10%.
- Prevent submitting/saving the invoice if the "Bill to" client is missing or the item list is purely empty.
