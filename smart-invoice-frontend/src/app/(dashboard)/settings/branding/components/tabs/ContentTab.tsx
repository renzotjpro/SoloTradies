"use client";

import { useBranding } from "@/lib/context/BrandingContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// SectionBlock — visual wrapper for each anatomical section
// ---------------------------------------------------------------------------
function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/70 overflow-hidden">
      <div className="px-4 py-2.5 bg-muted/40 border-b border-border/70">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      <div className="divide-y divide-border/50">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LabelInput — always-visible label text input with reset icon
// ---------------------------------------------------------------------------
function LabelInput({
  label,
  labelKey,
  defaultValue,
}: {
  label: string;
  labelKey: string;
  defaultValue: string;
}) {
  const { state, setLabel, resetLabel } = useBranding();
  const customValue = state.settings.labels[labelKey];
  const inputValue = customValue ?? "";

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="relative flex-1">
        <Input
          value={inputValue}
          onChange={(e) => setLabel(labelKey, e.target.value)}
          placeholder={defaultValue}
          className="h-7 text-xs pr-7"
        />
        {customValue && (
          <button
            onClick={() => resetLabel(labelKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            title="Reset to default"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ToggleWithLabel — toggle row + optional inline label input when ON
// ---------------------------------------------------------------------------
function ToggleWithLabel({
  toggleLabel,
  toggleDescription,
  toggleKey,
  labelKey,
  labelDefault,
  warning,
  children,
}: {
  toggleLabel: string;
  toggleDescription?: string;
  toggleKey: string;
  labelKey?: string;
  labelDefault?: string;
  warning?: string;
  children?: React.ReactNode;
}) {
  const { state, setFieldImmediate } = useBranding();
  const value = state.settings[toggleKey as keyof typeof state.settings] as boolean;

  function handleChange(checked: boolean) {
    if (!checked && warning) {
      toast.warning(warning, { duration: 5000 });
    }
    setFieldImmediate(toggleKey as keyof typeof state.settings, checked);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 px-4 py-3">
        <div className="flex-1 min-w-0">
          <Label className="text-sm font-medium text-foreground leading-none">{toggleLabel}</Label>
          {toggleDescription && (
            <p className="text-xs text-muted-foreground mt-0.5">{toggleDescription}</p>
          )}
        </div>
        <Switch checked={value} onCheckedChange={handleChange} className="shrink-0" />
      </div>
      {value && labelKey && labelDefault && (
        <div className="pb-1">
          <LabelInput label="Label" labelKey={labelKey} defaultValue={labelDefault} />
        </div>
      )}
      {value && children && <div className="pb-2 px-4">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// InvoiceTitlePicker — preset buttons + optional custom input
// ---------------------------------------------------------------------------
const TITLE_PRESETS = ["TAX INVOICE", "INVOICE", "QUOTE"];

function InvoiceTitlePicker() {
  const { state, setLabel, resetLabel } = useBranding();
  const customValue = state.settings.labels["invoice_title"];
  const activePreset = !customValue || TITLE_PRESETS.includes(customValue) ? (customValue ?? "TAX INVOICE") : "CUSTOM";

  function selectPreset(preset: string) {
    if (preset === "TAX INVOICE") {
      resetLabel("invoice_title");
    } else {
      setLabel("invoice_title", preset);
    }
  }

  return (
    <div className="px-4 py-3 space-y-2">
      <Label className="text-sm font-medium text-foreground">Invoice Title</Label>
      <div className="flex gap-1.5 flex-wrap">
        {TITLE_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => selectPreset(preset)}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              activePreset === preset
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-background text-muted-foreground border-border hover:border-brand-400 hover:text-foreground"
            }`}
          >
            {preset}
          </button>
        ))}
        <button
          onClick={() => {
            if (activePreset !== "CUSTOM") setLabel("invoice_title", "");
          }}
          className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
            activePreset === "CUSTOM"
              ? "bg-brand-600 text-white border-brand-600"
              : "bg-background text-muted-foreground border-border hover:border-brand-400 hover:text-foreground"
          }`}
        >
          Custom
        </button>
      </div>
      {activePreset === "CUSTOM" && (
        <Input
          value={customValue ?? ""}
          onChange={(e) => setLabel("invoice_title", e.target.value)}
          placeholder="Enter custom title..."
          className="h-8 text-sm"
          autoFocus
        />
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
    <div className="space-y-4 p-5">

      {/* ── Section 1: Header & Document Info ─────────────────────── */}
      <SectionBlock title="Header & Document Info">
        <InvoiceTitlePicker />
        <div className="border-t border-border/50">
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs text-muted-foreground">Document labels</p>
          </div>
          <LabelInput label="Invoice Number" labelKey="invoice_number" defaultValue="Number" />
          <LabelInput label="Issue Date" labelKey="issued_date" defaultValue="Issued" />
          <LabelInput label="Due Date" labelKey="due_date" defaultValue="Due" />
        </div>
        <ToggleWithLabel
          toggleLabel="Show PO Number"
          toggleKey="show_po_number"
          labelKey="po_number"
          labelDefault="PO Number"
        />
      </SectionBlock>

      {/* ── Section 2: Client Information ─────────────────────────── */}
      <SectionBlock title="Client Information">
        <LabelInput label="Bill To" labelKey="bill_to" defaultValue="To" />
        <ToggleWithLabel
          toggleLabel="Show client address"
          toggleKey="show_client_address"
        />
        <ToggleWithLabel
          toggleLabel="Show client ABN / Tax ID"
          toggleDescription="For business clients"
          toggleKey="show_client_abn"
          labelKey="client_abn_label"
          labelDefault="ABN"
        />
      </SectionBlock>

      {/* ── Section 3: Line Items Table ───────────────────────────── */}
      <SectionBlock title="Line Items Table">
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs text-muted-foreground">Column labels</p>
        </div>
        <LabelInput label="Description" labelKey="description" defaultValue="Description" />
        <LabelInput label="Rate / Price" labelKey="rate" defaultValue="Rate" />
        <ToggleWithLabel
          toggleLabel="Show quantity column"
          toggleKey="show_quantity_column"
          labelKey="quantity"
          labelDefault="Qty"
        />
        <ToggleWithLabel
          toggleLabel="Show quantity unit type"
          toggleDescription='E.g. "Hour", "Unit", "Metre"'
          toggleKey="show_quantity_type"
        />
      </SectionBlock>

      {/* ── Section 4: Totals & Summary ───────────────────────────── */}
      <SectionBlock title="Totals & Summary">
        <ToggleWithLabel
          toggleLabel="Show currency prefix (AUD)"
          toggleDescription='Shows "$AUD" instead of "$"'
          toggleKey="show_currency_prefix"
        />
        <ToggleWithLabel
          toggleLabel="Show GST breakdown"
          toggleDescription="Shows Subtotal + GST + Total"
          toggleKey="show_gst_breakdown"
          labelKey="gst_total"
          labelDefault="GST (10%)"
          warning="GST breakdown is required on tax invoices over $82.50 (Australian law)"
        />
        {!s.show_gst_breakdown && (
          <div className="flex items-start gap-2 mx-4 mb-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <strong>Compliance reminder:</strong> GST breakdown is legally required on Australian tax invoices for goods/services over $82.50.
            </span>
          </div>
        )}
        <ToggleWithLabel
          toggleLabel="Show discount row"
          toggleKey="show_discount_row"
          labelKey="discount"
          labelDefault="Discount"
        />
        <ToggleWithLabel
          toggleLabel="Show surcharge row"
          toggleKey="show_surcharge_row"
        />
        <ToggleWithLabel
          toggleLabel="Show balance / amount due"
          toggleKey="show_balance_due"
          labelKey="amount_due"
          labelDefault="Amount Due"
        />
      </SectionBlock>

      {/* ── Section 5: Content & Messaging ───────────────────────── */}
      <SectionBlock title="Content & Messaging">
        <ToggleWithLabel
          toggleLabel="Payment details section"
          toggleKey="show_payment_details"
        >
          <Textarea
            value={s.payment_details ?? ""}
            onChange={(e) => setField("payment_details", e.target.value)}
            placeholder={"Please make payments via direct deposit to:\nAcc Name: \nBSB: \nAcc No: "}
            className="text-sm resize-none mt-1"
            rows={4}
          />
        </ToggleWithLabel>
        <ToggleWithLabel
          toggleLabel="Footer message"
          toggleKey="show_footer_message"
        >
          <Textarea
            value={s.footer_message ?? ""}
            onChange={(e) => setField("footer_message", e.target.value)}
            placeholder="Thank you for your business."
            className="text-sm resize-none mt-1"
            rows={3}
          />
        </ToggleWithLabel>
        <ToggleWithLabel
          toggleLabel="Terms & conditions"
          toggleKey="show_terms_conditions"
        >
          <Textarea
            value={s.terms_conditions ?? ""}
            onChange={(e) => setField("terms_conditions", e.target.value)}
            placeholder="Enter your terms and conditions..."
            className="text-sm resize-none mt-1"
            rows={4}
          />
        </ToggleWithLabel>
        <ToggleWithLabel
          toggleLabel="Deposit due date"
          toggleKey="show_deposit_due_date"
        />
      </SectionBlock>

    </div>
  );
}
