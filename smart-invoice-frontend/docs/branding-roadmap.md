# Branding & Design Customisation - Roadmap

## 1. Overview and Architecture
Implement an interactive Branding and Design Customisation page for invoices. The page uses a split-screen design:
- **Left Side:** A live, interactive invoice preview that allows direct inline editing.
- **Right Side:** A settings panel with tabs for Brand, Font, Design, and Content visibility toggles.

The page will be located at a dedicated route: `src/app/settings/branding`.

## 2. State Management Strategy
Use Zustand (or React Context) to manage the global invoice template state. This includes:
- Branding details (logo, name, contact info, dual colors)
- Font choices (family, size)
- Design layouts (header, footer, table style, logo position)
- Visibility toggles for invoice fields
- Custom labels

## 3. UI Component Breakdown

### 3.1 Main Layout
- **`src/app/settings/branding/page.tsx`**: The main page container implementing the split-screen layout. It connects to the state store and provides the overall skeleton.

### 3.2 Settings Panels (Right Side)
- **`BrandingSettingsPanel.tsx`**: Container for the tabbed interface.
- **`tabs/BrandTab.tsx`**: Form inputs for business details, logo upload, header image, and dual color pickers with predefined palettes.
- **`tabs/FontTab.tsx`**: Selectors for typography with live preview snippets.
- **`tabs/DesignTab.tsx`**: Visual grid options for layout structures (header, footer, table style).
- **`tabs/ContentTab.tsx`**: Visibility toggles (e.g., ABN, Discounts, T&Cs) and collapsible lists of custom labels mapping to the preview.

### 3.3 Interactive Preview (Left Side)
- **`InteractiveInvoicePreview.tsx`**: Renders a sample invoice using current state.
- **Inline Editing Logic**: 
  - Text fields should highlight on hover.
  - Clicking a text field swaps it to an input component.
  - A floating mini-toolbar should provide formatting options (if applicable).
- **Color Syncing**: Clicking designated areas (like the header bar) should trigger the color picker or sync with the assigned brand colors.

## 4. Implementation Steps

1. **Phase 1: Foundation & Layout**
   - Create the route (`/settings/branding`).
   - Setup the Zustand store with default invoice data.
   - Build the basic split-screen shell (Preview area vs. Settings tabs).

2. **Phase 2: Settings Tabs UI**
   - Implement the `BrandTab` with standard inputs and color pickers.
   - Implement the `FontTab` and `DesignTab` using visual radio buttons/grids.
   - Implement the `ContentTab` with toggles.

3. **Phase 3: Static Preview Integration**
   - Build the `InteractiveInvoicePreview` to render statically based on the Zustand store values.
   - Ensure changes in the right panel immediately reflect on the left.

4. **Phase 4: Interactive Invoice Editing (The "Magic")**
   - Add hover states to editable text elements in the preview.
   - Implement click-to-edit functionality for text nodes.
   - Connect inline edits back to the global store so the right panel's "Content" labels update in sync.
   - Add logic to scroll the right panel to the relevant section when clicking an item on the preview.

5. **Phase 5: Polish & Final Features**
   - Implement auto-saving logic with a backend API (or simulated persistence).
   - Add mobile responsiveness (collapse split-screen into view/edit toggle).
   - Add the final "Undo/History" features and "Make it Professional" AI hooks if applicable.
