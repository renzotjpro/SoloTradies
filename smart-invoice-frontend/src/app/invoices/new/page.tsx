"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClientCombobox } from "@/components/client-combobox";
import {
  Plus,
  Trash2,
  FileText,
  Send,
  Save,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { BrandingProvider, useBranding } from "@/lib/context/BrandingContext";
import { InvoicePreview } from "@/app/settings/branding/components/InvoicePreview";
import { fetchBranding } from "@/lib/api/branding";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClientOption {
  id: number;
  name: string;
  email: string | null;
  company: string | null;
}

interface LineItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  price: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateInvoiceNumber(): string {
  const now = new Date();
  const seq = String(now.getTime()).slice(-5);
  return `INV-${seq}`;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

function formatDateForPreview(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Header layout SVG thumbnails (same as DesignTab) ────────────────────────

const HEADER_PREVIEWS = {
  full_bar: (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="0" y="0" width="80" height="12" fill="#3182CE" />
      <rect x="4" y="3" width="16" height="6" rx="1" fill="white" opacity="0.7" />
      <rect x="55" y="3" width="20" height="6" rx="1" fill="white" opacity="0.5" />
      <rect x="4" y="16" width="24" height="2" rx="1" fill="#CBD5E0" />
      <rect x="4" y="20" width="16" height="2" rx="1" fill="#E2E8F0" />
    </svg>
  ),
  centred: (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="28" y="2" width="24" height="8" rx="2" fill="#3182CE" opacity="0.6" />
      <rect x="20" y="13" width="40" height="2" rx="1" fill="#CBD5E0" />
      <rect x="24" y="17" width="32" height="2" rx="1" fill="#E2E8F0" />
      <rect x="4" y="26" width="72" height="1" fill="#E2E8F0" />
    </svg>
  ),
  split: (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="4" y="4" width="18" height="10" rx="2" fill="#3182CE" opacity="0.5" />
      <rect x="46" y="4" width="28" height="3" rx="1" fill="#CBD5E0" />
      <rect x="46" y="9" width="20" height="2" rx="1" fill="#E2E8F0" />
      <rect x="46" y="13" width="24" height="2" rx="1" fill="#E2E8F0" />
      <rect x="4" y="22" width="72" height="1" fill="#E2E8F0" />
    </svg>
  ),
} as const;

// ─── Inner page content (needs BrandingProvider above it) ────────────────────

function NewInvoicePageContent() {
  const router = useRouter();
  const { state: brandingState, load: loadBranding, setField, setFieldImmediate } =
    useBranding();
  const bs = brandingState.settings;

  // Load branding settings on mount (same pattern as branding settings page)
  useEffect(() => {
    fetchBranding().then(loadBranding).catch(() => {});
  }, [loadBranding]);

  // Invoice meta
  const [invoiceNumber] = useState(generateInvoiceNumber);
  const [dueDateOption, setDueDateOption] = useState("30");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return formatDate(d);
  });

  // Business info
  const [businessName, setBusinessName] = useState("Your Business Name");
  const [businessAddress, setBusinessAddress] = useState(
    "123 Main Street, Sydney NSW 2000"
  );

  // Clients
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("http://localhost:8000/clients/");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setClients(data);
      } catch {
        // Clients will be empty — user can still see the dropdown
      } finally {
        setClientsLoading(false);
      }
    }
    loadClients();
  }, []);

  // Line items
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", qty: 1, unit: "hour", price: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  // GST mode
  const [gstMode, setGstMode] = useState<"exclusive" | "inclusive">("exclusive");

  // ─── Computed totals ────────────────────────────────────────────────────────

  const rawSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.qty * item.price, 0),
    [items]
  );

  const { subtotal, gst, total } = useMemo(() => {
    if (gstMode === "exclusive") {
      const g = rawSubtotal * 0.1;
      return { subtotal: rawSubtotal, gst: g, total: rawSubtotal + g };
    } else {
      // Inclusive: line items already contain GST
      const exGst = rawSubtotal / 1.1;
      const g = rawSubtotal - exGst;
      return { subtotal: exGst, gst: g, total: rawSubtotal };
    }
  }, [rawSubtotal, gstMode]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handleDueDateChange(val: string) {
    setDueDateOption(val);
    if (["14", "30", "45"].includes(val)) {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(val));
      setDueDate(formatDate(d));
    } else if (val === "none") {
      setDueDate("");
    }
    // "custom" — user sets via the date Input that appears below
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", qty: 1, unit: "hour", price: 0 },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
  }

  function updateItem(id: string, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  const selectedClient = clients.find((c) => c.id === Number(selectedClientId));

  async function handleSave(status: string) {
    if (!selectedClientId) {
      alert("Please select a client.");
      return;
    }
    if (items.every((i) => !i.description.trim())) {
      alert("Please add at least one line item with a description.");
      return;
    }

    setSaving(true);

    const invoiceItems = items
      .filter((i) => i.description.trim())
      .map((i) => ({
        description: `${i.description} (${i.qty} ${i.unit})`,
        quantity: i.qty,
        unit_price: i.price,
        tax_rate: 0.1,
      }));

    try {
      const res = await fetch("http://localhost:8000/invoices/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_number: invoiceNumber,
          client_id: Number(selectedClientId),
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          status,
          notes: notes.trim() || null,
          items: invoiceItems,
        }),
      });

      if (!res.ok) throw new Error("Failed to save invoice");
      router.push("/invoices");
    } catch {
      alert("Failed to save invoice. Is the backend running?");
    } finally {
      setSaving(false);
    }
  }

  // ─── Live preview data for the sidebar InvoicePreview ───────────────────────

  const livePreviewData = useMemo(() => {
    const today = new Date().toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const dueDateFormatted = dueDate ? formatDateForPreview(dueDate) : "No due date";

    const previewItems = items
      .filter((i) => i.description.trim())
      .map((item) => {
        const lineTotal = item.qty * item.price;
        const lineGst =
          gstMode === "exclusive"
            ? lineTotal * 0.1
            : lineTotal - lineTotal / 1.1;
        const lineWithGst = gstMode === "exclusive" ? lineTotal + lineGst : lineTotal;
        return {
          desc: item.description,
          qty: item.qty,
          unit: item.unit.charAt(0).toUpperCase() + item.unit.slice(1),
          rate: formatCurrency(item.price),
          gst: formatCurrency(lineGst),
          total: formatCurrency(lineWithGst),
        };
      });

    return {
      clientName: selectedClient?.name,
      clientCompany: selectedClient?.company ?? undefined,
      invoiceNumber,
      issued: today,
      due: dueDateFormatted,
      grandTotal: formatCurrency(total),
      items: previewItems.length > 0 ? previewItems : undefined,
      subtotal: formatCurrency(subtotal),
      gst: formatCurrency(gst),
    };
  }, [selectedClient, invoiceNumber, dueDate, items, subtotal, gst, total, gstMode]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Invoice</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and send a professional invoice
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleSave("Draft")}
            disabled={saving}
          >
            <Save className="size-4" />
            Save Draft
          </Button>
          <Button
            className="bg-brand-600 hover:bg-brand-700 text-white"
            onClick={() => handleSave("Sent")}
            disabled={saving}
          >
            <Send className="size-4" />
            Send Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ══════════════════════════════════════════════════════════
            Left — Invoice Form
        ══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business & Invoice Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                {/* Business Info */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="size-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                      <FileText className="size-5 text-brand-600" />
                    </div>
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="font-semibold text-lg border-none shadow-none p-0 h-auto focus-visible:ring-0"
                      placeholder="Business Name"
                    />
                  </div>
                  <Input
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="text-sm text-muted-foreground border-none shadow-none p-0 h-auto focus-visible:ring-0"
                    placeholder="Business Address"
                  />
                </div>

                {/* Invoice Meta — Issue Date removed, number only */}
                <div className="min-w-[160px]">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Invoice Number
                  </Label>
                  <p className="font-mono font-semibold text-sm mt-1">
                    {invoiceNumber}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bill To</CardTitle>
              <CardDescription>Client details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <ClientCombobox
                    clients={clients}
                    value={selectedClientId}
                    onChange={setSelectedClientId}
                    loading={clientsLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client Email</Label>
                  <p className="text-sm py-2 text-muted-foreground">
                    {selectedClient?.email || "—"}
                  </p>
                </div>

                {/* Due Date — Select dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Select value={dueDateOption} onValueChange={handleDueDateChange}>
                    <SelectTrigger id="due-date">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="45">45 days</SelectItem>
                      <SelectItem value="none">No due date</SelectItem>
                      <SelectItem value="custom">Select date</SelectItem>
                    </SelectContent>
                  </Select>
                  {dueDateOption === "custom" && (
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  )}
                  {["14", "30", "45"].includes(dueDateOption) && dueDate && (
                    <p className="text-xs text-muted-foreground">
                      Due {formatDateForPreview(dueDate)}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment terms, thank you message, etc."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line Items</CardTitle>
              <CardDescription>
                Add services or products — GST at 10%{" "}
                ({gstMode === "exclusive" ? "exclusive" : "inclusive"})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[1fr_80px_100px_100px_80px_100px_40px] gap-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
                <span>Description</span>
                <span>Qty</span>
                <span>Unit</span>
                <span>Price</span>
                <span>GST</span>
                <span className="text-right">Total</span>
                <span />
              </div>

              <div className="space-y-3">
                {items.map((item) => {
                  const lineTotal = item.qty * item.price;
                  const lineGst =
                    gstMode === "exclusive"
                      ? lineTotal * 0.1
                      : lineTotal - lineTotal / 1.1;
                  const lineWithGst =
                    gstMode === "exclusive" ? lineTotal + lineGst : lineTotal;
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-[1fr_80px_100px_100px_80px_100px_40px] gap-3 items-center p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                    >
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(item.id, "description", e.target.value)
                        }
                        placeholder="Service or product"
                        className="bg-background"
                      />
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(item.id, "qty", parseFloat(e.target.value) || 0)
                        }
                        className="bg-background"
                      />
                      <Select
                        value={item.unit}
                        onValueChange={(v) => updateItem(item.id, "unit", v)}
                      >
                        <SelectTrigger className="bg-background w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hour">Hour</SelectItem>
                          <SelectItem value="item">Item</SelectItem>
                          <SelectItem value="day">Day</SelectItem>
                          <SelectItem value="sqm">Sqm</SelectItem>
                          <SelectItem value="metre">Metre</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          $
                        </span>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.price}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "price",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="pl-7 bg-background"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground text-center tabular-nums">
                        {formatCurrency(lineGst)}
                      </span>
                      <span className="text-sm font-medium text-right tabular-nums">
                        {formatCurrency(lineWithGst)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              <Button
                variant="ghost"
                onClick={addItem}
                className="mt-4 text-brand-600 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/20"
              >
                <Plus className="size-4" />
                Add Line Item
              </Button>

              {/* Totals */}
              <Separator className="my-6" />
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Subtotal{gstMode === "inclusive" ? " (ex. GST)" : ""}
                    </span>
                    <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      GST ({gstMode === "exclusive" ? "10%" : "incl."})
                    </span>
                    <span className="tabular-nums">{formatCurrency(gst)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details & Footer Notes (Phase 6 — writes to global branding defaults) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment & Footer</CardTitle>
              <CardDescription>
                Saved as global defaults — appear on all invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment-details">Payment Details</Label>
                <Textarea
                  id="payment-details"
                  value={bs.payment_details ?? ""}
                  onChange={(e) => setField("payment_details", e.target.value)}
                  placeholder="Bank name, BSB, account number, reference..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer-notes">Footer Notes</Label>
                <Textarea
                  id="footer-notes"
                  value={bs.footer_message ?? ""}
                  onChange={(e) => setField("footer_message", e.target.value)}
                  placeholder="Thank you for your business..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ══════════════════════════════════════════════════════════
            Right — Settings Sidebar
        ══════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          {/* ── Section 1: Preview ─────────────────────────────────── */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Preview
              </CardTitle>
            </CardHeader>
            <div
              className="relative overflow-hidden bg-muted/30"
              style={{ height: "320px" }}
            >
              <div
                style={{
                  transform: "scale(0.5)",
                  transformOrigin: "top left",
                  width: "640px",
                  pointerEvents: "none",
                }}
              >
                <InvoicePreview invoiceData={livePreviewData} />
              </div>
            </div>
          </Card>

          {/* ── Section 2: Branding & Design ───────────────────────── */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Branding & Design
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              {/* Accent colour */}
              <div className="space-y-2">
                <Label className="text-xs">Accent Colour</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bs.colour_graphical}
                    onChange={(e) =>
                      setFieldImmediate("colour_graphical", e.target.value)
                    }
                    className="h-8 w-10 rounded cursor-pointer border border-border"
                    aria-label="Accent colour picker"
                  />
                  <span className="text-xs font-mono text-muted-foreground">
                    {bs.colour_graphical}
                  </span>
                </div>
              </div>

              {/* Header layout */}
              <div className="space-y-2">
                <Label className="text-xs">Header Layout</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["full_bar", "centred", "split"] as const).map((layout) => (
                    <button
                      key={layout}
                      onClick={() => setFieldImmediate("header_layout", layout)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-medium transition-all ${
                        bs.header_layout === layout
                          ? "border-brand-600 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 ring-1 ring-brand-600/30"
                          : "border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <div className="w-full h-8 rounded overflow-hidden bg-white dark:bg-zinc-800 border border-border/60 flex items-center justify-center">
                        {HEADER_PREVIEWS[layout]}
                      </div>
                      {layout === "full_bar"
                        ? "Full"
                        : layout === "centred"
                        ? "Centred"
                        : "Split"}
                    </button>
                  ))}
                </div>
              </div>

              <Link
                href="/settings/branding"
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Manage full branding
                <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>

          {/* ── Section 3: GST ─────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                GST ({gstMode === "exclusive" ? "Exclusive" : "Inclusive"})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  onClick={() => setGstMode("exclusive")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    gstMode === "exclusive"
                      ? "bg-brand-600 text-white"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Exclusive
                </button>
                <button
                  onClick={() => setGstMode("inclusive")}
                  className={`flex-1 py-2 text-sm font-medium border-l transition-colors ${
                    gstMode === "inclusive"
                      ? "bg-brand-600 text-white"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Inclusive
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {gstMode === "exclusive"
                  ? "GST is added on top of your prices."
                  : "GST is already included in your prices."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Page export — wrapped with BrandingProvider ─────────────────────────────

export default function NewInvoicePage() {
  return (
    <BrandingProvider>
      <NewInvoicePageContent />
    </BrandingProvider>
  );
}
