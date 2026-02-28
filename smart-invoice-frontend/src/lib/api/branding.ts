const BASE = "http://localhost:8000/api/v1/branding";

export interface BrandingSettings {
  id: string;
  owner_id: number;
  // Brand
  logo_url: string | null;
  header_image_url: string | null;
  display_name: string | null;
  business_name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  abn: string | null;
  colour_text: string;
  colour_graphical: string;
  // Font
  font_family: string;
  font_size: string;
  // Design
  template_id: string;
  header_layout: string;
  footer_layout: string;
  table_style: string;
  logo_position: string;
  // Toggles
  show_client_address: boolean;
  show_client_abn: boolean;
  show_quantity_column: boolean;
  show_quantity_type: boolean;
  show_currency_prefix: boolean;
  show_gst_breakdown: boolean;
  show_discount_row: boolean;
  show_surcharge_row: boolean;
  show_balance_due: boolean;
  show_po_number: boolean;
  show_deposit_due_date: boolean;
  show_payment_details: boolean;
  show_footer_message: boolean;
  show_terms_conditions: boolean;
  // Content
  payment_details: string | null;
  payment_terms: string;
  footer_message: string | null;
  terms_conditions: string | null;
  invoice_prefix: string | null;
  default_notes: string | null;
  // Labels
  labels: Record<string, string>;
  created_at: string | null;
  updated_at: string | null;
}

export const DEFAULT_BRANDING: BrandingSettings = {
  id: "",
  owner_id: 1,
  logo_url: null,
  header_image_url: null,
  display_name: null,
  business_name: null,
  address: null,
  phone: null,
  email: null,
  abn: null,
  colour_text: "#333333",
  colour_graphical: "#C0392B",
  font_family: "Inter",
  font_size: "regular",
  template_id: "tradie_classic",
  header_layout: "full_bar",
  footer_layout: "full_width",
  table_style: "bordered",
  logo_position: "top_left",
  show_client_address: false,
  show_client_abn: false,
  show_quantity_column: true,
  show_quantity_type: true,
  show_currency_prefix: false,
  show_gst_breakdown: true,
  show_discount_row: false,
  show_surcharge_row: false,
  show_balance_due: true,
  show_po_number: false,
  show_deposit_due_date: false,
  show_payment_details: true,
  show_footer_message: true,
  show_terms_conditions: false,
  payment_details:
    "Please make payments via direct deposit to:\nAcc Name: \nBSB: \nAcc No: ",
  payment_terms: "14_days",
  footer_message:
    "Thank you for your business.\nI'm looking forward to working with you again in the future.",
  terms_conditions: null,
  invoice_prefix: null,
  default_notes: null,
  labels: {},
  created_at: null,
  updated_at: null,
};

export async function fetchBranding(): Promise<BrandingSettings> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error("Failed to fetch branding");
  return res.json();
}

export async function saveBranding(
  data: Partial<BrandingSettings>
): Promise<BrandingSettings> {
  const res = await fetch(BASE, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save branding");
  return res.json();
}

export async function saveLabel(key: string, value: string): Promise<void> {
  const res = await fetch(`${BASE}/labels/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label_value: value }),
  });
  if (!res.ok) throw new Error("Failed to save label");
}

export async function saveLabelsBatch(
  labels: Record<string, string>
): Promise<void> {
  const res = await fetch(`${BASE}/labels`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(labels),
  });
  if (!res.ok) throw new Error("Failed to save labels");
}

export async function deleteLabel(key: string): Promise<void> {
  const res = await fetch(`${BASE}/labels/${key}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete label");
}
