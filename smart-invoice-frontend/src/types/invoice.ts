export interface InvoiceClient {
  id: number;
  name: string;
  email: string | null;
  company: string | null;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  issue_date: string;
  due_date: string | null;
  client_id: number;
  client: InvoiceClient | null;
  notes: string | null;
}

export interface InvoiceGroup {
  client: InvoiceClient | null;
  invoices: Invoice[];
  balance: number;
}
