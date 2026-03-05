const BASE = "http://localhost:8000/api/v1/dashboard";

export interface OverviewStats {
  total_invoices: number;
  outstanding_amount: number;
  paid_this_month: number;
  upcoming_payments: number;
}

export interface CashflowDataPoint {
  month: string;
  amount: number;
}

export interface InvoiceStatusDataPoint {
  status: string;
  amount: number;
}

export async function fetchOverviewStats(): Promise<OverviewStats> {
  const res = await fetch(`${BASE}/overview`);
  if (!res.ok) throw new Error("Failed to fetch overview stats");
  return res.json();
}

export async function fetchCashflow(): Promise<CashflowDataPoint[]> {
  const res = await fetch(`${BASE}/cashflow`);
  if (!res.ok) throw new Error("Failed to fetch cashflow data");
  return res.json();
}

export async function fetchInvoiceStats(): Promise<InvoiceStatusDataPoint[]> {
  const res = await fetch(`${BASE}/invoice-stats`);
  if (!res.ok) throw new Error("Failed to fetch invoice stats");
  return res.json();
}
