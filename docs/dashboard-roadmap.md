# Smart Invoicing Dashboard Roadmap

## High-Level Strategy

This dashboard is designed specifically for tradies, meaning it must prioritize **mobile-first responsiveness**, **speed**, and **clarity**. The goal is to provide a comprehensive "Overview" screen that instantly communicates financial health (cashflow, outstanding invoices, paid invoices) without overwhelming the user.

### Technology Stack
*   **Frontend:** React / Next.js (Existing)
*   **Styling:** Tailwind CSS (Existing) + `shadcn/ui` (Recommended for fast, beautiful accessible components)
*   **Icons:** `lucide-react` (Clean, professional SVG icons)
*   **Data Visualization:** `recharts` (Declarative, responsive, and easy to animate React charts)
*   **Data Fetching:** TanStack Query (`react-query`) (Essential for caching and background fetching dashboard data)
*   **Backend:** FastAPI / Python (Existing)
*   **Database:** PostgreSQL (Existing)

---

## Implementation Plan

### Phase 1: Backend Data Aggregation (FastAPI)
The frontend should not download all invoices to calculate stats. The backend must do the heavy lifting and send pre-aggregated data.

1.  **Define Pydantic Schemas (`app/schemas/dashboard.py`)**
    *   `OverviewStats`: `total_invoices` (int), `outstanding_amount` (float), `paid_this_month` (float), `upcoming_payments` (int).
    *   `CashflowDataPoint`: `month` (str), `amount` (float).
    *   `InvoiceStatusDataPoint`: `status` (str), `amount` (float).
2.  **Implement CRUD Operations (`app/crud/dashboard.py`)**
    *   `get_overview_stats(db, user_id)`: Sums amounts and counts statuses based on current date.
    *   `get_cashflow_summary(db, user_id, months_back=6)`: Groups paid invoices by month.
    *   `get_invoice_status_summary(db, user_id, months_back=6)`: Groups invoice totals by Draft, Sent, Paid, and Overdue statuses.
3.  **Create API Endpoints (`app/api/endpoints/dashboard.py`)**
    *   `GET /api/v1/dashboard/overview`
    *   `GET /api/v1/dashboard/cashflow`
    *   `GET /api/v1/dashboard/invoice-stats`

### Phase 2: Frontend Setup & Dependencies (React)
1.  **Install Required Libraries:**
    ```bash
    npm install recharts lucide-react @tanstack/react-query
    ```
2.  **Configure React Query:** Ensure `QueryClientProvider` wraps the application (if not already implemented) so components can use custom hooks for data fetching.

### Phase 3: Component Development (Tailwind + Recharts)
1.  **`OverviewCards` Component:**
    *   Design four distinct metric cards using Tailwind (soft green backgrounds, rounded corners).
    *   Integrate `lucide-react` icons (e.g., `FileText`, `DollarSign`, `CheckCircle`, `PiggyBank`).
2.  **`CashflowChart` Component:**
    *   Implement an `<AreaChart>` or `<LineChart>` using `recharts`.
    *   Apply a smooth curve type (`monotone`).
    *   Style the line and fill with the brand's green gradient.
3.  **`InvoiceStatusChart` Component:**
    *   Implement a `<BarChart>` using `recharts`.
    *   Define distinct fill colors mapping to statuses (e.g., Green for Paid, Light Green for Draft/Sent, Red for Overdue).
4.  **`DashboardPage` (Main Layout):**
    *   Fetch data using `useQuery` hooks.
    *   Handle loading states (skeletons) and error states.
    *   Assemble the grid layout: `OverviewCards` spanning the top, followed by a 2-column split for the `CashflowChart` and `InvoiceStatusChart` on desktop (stacking on mobile).

### Phase 4: Polish & Performance
1.  **Responsive Check:** Ensure charts resize correctly and flexbox/grid containers stack elegantly on mobile screens (the primary device for tradies).
2.  **Number Formatting:** Implement a utility function to format currency consistently (e.g., `$2,718.55`) and abbreviate large axis numbers on charts (e.g., `$22K`).
3.  **Caching:** Verify that React Query is caching the dashboard state correctly so navigating away and coming back feels instantaneous.
