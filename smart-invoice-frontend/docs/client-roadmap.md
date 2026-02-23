# Client Page Strategy & Roadmap

## 1. Overview
The goal is to build a modern, intuitive "Clients" management page that strictly adheres to the Australian Taxation Office (ATO) invoicing requirements. The provided UI reference features a clean grid of client cards.

## 2. ATO Compliance Strategy
For correct invoicing in Australia, the primary business identifier is the **ABN (Australian Business Number)**, rather than the international GSTIN.
*   **Identifier Replacement**: Replace "GSTIN" with "ABN" in the user interface and data models.
*   **Data Formatting**: Ensure Australian phone number formats (e.g., `04XX XXX XXX` or `(0X) XXXX XXXX`) are used in mock data and validation.
*   **Tax Considerations**: While this page is for clients, ensure the data model can accommodate GST-registration status (whether the client is GST-registered) if required for future invoice calculations, though ABN is the minimum MVP requirement.

## 3. UI/UX Design Plan
*   **Layout**: A main container with a top action bar and a responsive CSS Grid for client cards.
*   **Top Bar**:
    *   **Page Title**: "Clients"
    *   **Search Bar**: Input field to search by client name, brand, or email.
    *   **Action Button**: A stylized primary button `+ New client`.
*   **Client Card**:
    *   **Header**: User Avatar, Name, and Role (e.g., "Product Manager").
    *   **Details Grid**: A 2-column layout for:
        *   Company & Email
        *   Phone & ABN
    *   **Styling**: Use soft shadows, rounded corners, clear typography, and subtle hover animations to make checking client details feel active.

## 4. Component Architecture
*   `src/app/clients/page.tsx`: The main route acting as the orchestrator.
*   `src/components/clients/ClientGrid.tsx`: Maps over the client data to display cards.
*   `src/components/clients/ClientCard.tsx`: The individual card UI.
*   `src/components/clients/ClientTopBar.tsx`: Contains the search input and add button.

## 5. Data Structure (TypeScript Interface)

```typescript
export interface Client {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string; // Optional URL for a user portrait image
  company: string;
  email: string;
  phone: string;
  abn: string; // ATO Requirement replacing GSTIN
}
```

## 6. Implementation Steps
1.  **Setup the Route**: Create the `clients` directory in the Next.js `app` router and add `page.tsx`.
2.  **Define Mock Data**: Create an array of mock `Client` objects using valid Australian ABN lengths/formats (e.g., `11 222 333 444`) and standard names.
3.  **Build UI Components**:
    *   Develop the `ClientCard` first to get the spacing, layout, and font sizing consistent with the minimalist reference.
    *   Develop the `ClientTopBar` with the search input icon.
    *   Assemble them into `ClientGrid` in the main page.
4.  **Add Interactivity**: Wire up the search bar to filter the mock data on changes to the text.
5.  **Refine UI**: Ensure responsive behavior so the grid collapses to 1 column on mobile, 2 on tablet, and 3-4 on desktop. Add subtle hover scaling to the cards for an active, engaged feel.
