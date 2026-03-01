# Mobile & Responsive Roadmap: SoloTradies

This document outlines the strategy and implementation plan for making the SoloTradies application fully responsive, optimizing heavily for mobile, one-handed use by tradies.

## 1. Global Navigation Architecture

**Objective:** Shift from a rigid desktop sidebar to context-aware navigation based on the user's device screen size.

### Desktop & Large Tablet (>= 1024px)
- **Component:** Fixed Left Sidebar (`w-64`).
- **Styling:** White background, dark grey inactive text with high-contrast icons. Active state uses a solid brand-green pill background with white text.
- **Header:** "Invoize" logo and a "Collapse" (<-) toggle.
- **Primary CTA:** A prominent "Create Invoice" button anchored at the bottom of the sidebar.
- **Page Layout:** Main content area offsets left by `ml-64`.

### Mid-size Tablet (768px - 1023px)
- **Component:** Collapsible Sidebar ("Slim Mode").
- **Behavior:** Defaults to an 80px wide icon-only mode to save horizontal space. Expands to full width (`w-64`) on hover.
- **Page Layout:** Main content area offsets left by `ml-20`.

### Mobile (<= 767px)
- **Component:** Bottom Tab Navigation Bar.
- **Behavior:** The left sidebar is completely hidden. A fixed white bar (`h-16`) with a top shadow is pinned to the bottom of the viewport.
- **Items:** Displays only the 4 core icons: Dashboard, Invoices, Clients, Settings.
- **Primary CTA:** Center FAB (Floating Action Button). A large, elevated circular green button with a "+" icon, positioned in the absolute center of the bottom bar.
- **Page Layout:** Content offset `ml-0`, but requires bottom padding (`pb-20`) so content isn't obscured by the fixed tab bar.

---

## 2. Invoice Creation Screen (`/invoices/new`)

**Objective:** Maintain a complex data-entry form while ensuring touch targets and layouts remain highly usable on small screens.

### Desktop Layout (>= 1024px)
- **Structure:** Dual-panel split layout.
- **Left Panel (Form):** Takes up roughly 65% of the screen width, scrolls independently.
- **Right Panel (Preview/Settings):** Takes up the remaining 35% and is visually sticky/pinned to the right side of the screen.

### Tablet Layout (768px - 1023px)
- **Structure:** Stacked Layout.
- **Left Panel:** Expands to 100% width for easier data entry on touch screens.
- **Right Panel:** Moves directly beneath the form.
- **Line Items:** Retains the horizontal table-row format, but horizontal padding is reduced to fit within the viewport.

### Mobile Layout (<= 767px)
- **Structure:** Single column, 100% width, standard 16px padding.
- **Header:** Title and breadcrumbs stack vertically.
- **Global Actions:** The "Save Draft" and "Send Invoice" buttons move from the top header to a fixed, full-width Action Bar pinned to the bottom of the screen (just above the bottom navigation/FAB).
- **Preview Access:** The live preview panel is hidden. Replaced by a sticky "Preview" Floating Action Button that triggers a full-screen Invoice Zoom Modal.

---

## 3. Mobile Line Item Component Refactor

**Objective:** Convert the desktop table-row layout into a touch-friendly stacked Card component for mobile viewports.

### Card Container
- Wrap each line item in a distinctive card.
- **Styling:** White background, subtle 1px border or light drop shadow, 12px rounded corners, and a 16px bottom margin to separate items.
- **Touch Targets:** Ensure all interactive inputs and buttons inside the card have a minimum height of `44px`.

### Row 1: Description & Controls
- **Header Top:** Drag-and-drop handle (six dots) top-left, "Delete" (Trash) top-right.
- **Content:** The "Description" input spans 100% full-width immediately below the controls.

### Row 2: Quantities & Rates
- **Layout:** Horizontal Flex container.
- **Items:** Qty (number input), Unit (dropdown), and Rate (number input with left-aligned $).
- **Behavior:** These fields sit side-by-side. If the device width is extremely narrow, the Rate input wraps to the next line, keeping Qty and Unit grouped.

### Row 3: Totals & Tax Footer
- **Layout:** Horizontal Flex (`justify-between`), separated by a top border.
- **Left Side:** "GST" text label paired with an inline toggle switch.
- **Right Side:** Dynamically calculated line Total, rendered in bold (`font-bold text-lg`) to draw attention.
