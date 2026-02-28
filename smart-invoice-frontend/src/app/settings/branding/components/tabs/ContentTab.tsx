"use client";

import { useState } from "react";
import { useBranding } from "@/lib/context/BrandingContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Toggle row
// ---------------------------------------------------------------------------
function ToggleRow({
  label,
  description,
  fieldKey,
  warning,
}: {
  label: string;
  description?: string;
  fieldKey: keyof ReturnType<typeof useBranding>["state"]["settings"];
  warning?: string;
}) {
  const { state, setFieldImmediate } = useBranding();
  const value = state.settings[fieldKey] as boolean;

  function handleChange(checked: boolean) {
    if (!checked && warning) {
      toast.warning(warning, { duration: 5000 });
    }
    setFieldImmediate(fieldKey, checked);
  }

  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border/60 last:border-0">
      <div className="flex-1 min-w-0">
        <Label className="text-sm font-medium text-foreground leading-none">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Switch
        checked={value}
        onCheckedChange={handleChange}
        className="shrink-0"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible label reference section
// ---------------------------------------------------------------------------
function LabelSection({
  title,
  labels,
}: {
  title: string;
  labels: { key: string; display: string; defaultValue: string }[];
}) {
  const [open, setOpen] = useState(false);
  const { state } = useBranding();

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 text-sm font-semibold text-foreground transition-colors"
      >
        {title}
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && (
        <div className="divide-y divide-border/60">
          {labels.map((l) => {
            const currentValue = state.settings.labels[l.key] ?? l.defaultValue;
            return (
              <div key={l.key} className="flex items-center justify-between px-4 py-2.5 gap-3">
                <span className="text-xs text-muted-foreground w-28 shrink-0">{l.display}</span>
                <span className="text-xs font-medium text-foreground truncate">
                  &ldquo;{currentValue}&rdquo;
                </span>
                <span className="text-xs text-brand-600 dark:text-brand-400 shrink-0 whitespace-nowrap">
                  Edit on invoice →
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ContentTab
// ---------------------------------------------------------------------------
export function ContentTab() {
  const { state, setField } = useBranding();
  const s = state.settings;

  return (
    <div className="space-y-6 p-5">
      {/* ── Show/Hide Toggles ────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Show / Hide Sections</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Control which fields appear on all your invoices.
        </p>
        <div>
          <ToggleRow label="Client address" fieldKey="show_client_address" />
          <ToggleRow label="Client ABN" description="For business clients only" fieldKey="show_client_abn" />
          <ToggleRow label="Quantity column" fieldKey="show_quantity_column" />
          <ToggleRow label="Quantity unit type" description='E.g. "Hour", "Unit", "Metre"' fieldKey="show_quantity_type" />
          <ToggleRow label="Currency prefix (AUD)" description='Shows "$AUD" instead of "$"' fieldKey="show_currency_prefix" />
          <ToggleRow
            label="GST breakdown"
            description="Shows Subtotal + GST + Total"
            fieldKey="show_gst_breakdown"
            warning="GST breakdown is required on tax invoices over $82.50 (Australian law)"
          />
          <ToggleRow label="Discount row" fieldKey="show_discount_row" />
          <ToggleRow label="Surcharge row" fieldKey="show_surcharge_row" />
          <ToggleRow label="Balance / Amount Due" fieldKey="show_balance_due" />
          <ToggleRow label="PO Number field" fieldKey="show_po_number" />
          <ToggleRow label="Deposit Due Date" fieldKey="show_deposit_due_date" />
          <ToggleRow label="Payment details section" fieldKey="show_payment_details" />
          <ToggleRow label="Footer message" fieldKey="show_footer_message" />
          <ToggleRow label="Terms & conditions" fieldKey="show_terms_conditions" />
        </div>
      </div>

      {/* ── GST compliance reminder ───────────────────── */}
      {!s.show_gst_breakdown && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <strong>Compliance reminder:</strong> GST breakdown is legally required on Australian tax invoices for goods/services over $82.50.
          </span>
        </div>
      )}

      {/* ── Payment details text ─────────────────────── */}
      {s.show_payment_details && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Payment Details Text</h3>
          <Textarea
            value={s.payment_details ?? ""}
            onChange={(e) => setField("payment_details", e.target.value)}
            placeholder="Please make payments via direct deposit to:&#10;Acc Name: &#10;BSB: &#10;Acc No: "
            className="text-sm resize-none"
            rows={5}
          />
        </div>
      )}

      {/* ── Footer message ───────────────────────────── */}
      {s.show_footer_message && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Footer Message</h3>
          <Textarea
            value={s.footer_message ?? ""}
            onChange={(e) => setField("footer_message", e.target.value)}
            placeholder="Thank you for your business."
            className="text-sm resize-none"
            rows={3}
          />
        </div>
      )}

      {/* ── Terms & conditions ───────────────────────── */}
      {s.show_terms_conditions && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Terms & Conditions</h3>
          <Textarea
            value={s.terms_conditions ?? ""}
            onChange={(e) => setField("terms_conditions", e.target.value)}
            placeholder="Enter your terms and conditions..."
            className="text-sm resize-none"
            rows={4}
          />
        </div>
      )}

      {/* ── Label reference sections ─────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Label Reference</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Click labels directly on the invoice preview to rename them (coming in Phase 2). Current values shown below.
        </p>
        <div className="space-y-2">
          <LabelSection
            title="▸ Header Labels"
            labels={[
              { key: "invoice_title", display: "Invoice title", defaultValue: "TAX INVOICE" },
              { key: "bill_to", display: "Bill to", defaultValue: "To" },
              { key: "invoice_number", display: "Invoice number", defaultValue: "Number" },
              { key: "issued_date", display: "Issued date", defaultValue: "Issued" },
              { key: "due_date", display: "Due date", defaultValue: "Due" },
            ]}
          />
          <LabelSection
            title="▸ Table Labels"
            labels={[
              { key: "description", display: "Description", defaultValue: "Description" },
              { key: "quantity", display: "Quantity", defaultValue: "Quantity" },
              { key: "rate", display: "Rate", defaultValue: "Rate" },
              { key: "gst_column", display: "GST column", defaultValue: "GST" },
              { key: "total_column", display: "Total column", defaultValue: "Total" },
            ]}
          />
          <LabelSection
            title="▸ Totals Labels"
            labels={[
              { key: "subtotal", display: "Subtotal", defaultValue: "Subtotal" },
              { key: "gst_total", display: "GST", defaultValue: "GST" },
              { key: "grand_total", display: "Grand total", defaultValue: "Total" },
              { key: "discount", display: "Discount", defaultValue: "Discount" },
            ]}
          />
          <LabelSection
            title="▸ Payment Labels"
            labels={[
              { key: "payment_heading", display: "Payment heading", defaultValue: "PAYMENT DETAILS" },
              { key: "received_heading", display: "Received", defaultValue: "Payments Received" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
