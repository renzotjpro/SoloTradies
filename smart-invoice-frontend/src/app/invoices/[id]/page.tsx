"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ClientCombobox } from "@/components/client-combobox";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Pencil,
  X,
  Trash2,
  Plus,
  Loader2,
  Mail,
  CheckCircle,
  AlertCircle,
  Receipt,
  FileText,
  Copy,
  Link2,
  Eye,
  RotateCcw,
  Paperclip,
  ChevronDown,
  GripVertical,
  ZoomIn,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { fetchBranding } from "@/lib/api/branding";
import { InvoicePreview } from "@/app/settings/branding/components/InvoicePreview";

const API_BASE = "http://localhost:8000";

interface ClientOption {
  id: number;
  name: string;
  email: string | null;
  company: string | null;
}

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_rate: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  issue_date: string;
  due_date: string | null;
  client_id: number;
  client: ClientOption | null;
  notes: string | null;
  accent_color: string | null;
  header_layout: string | null;
  items: InvoiceItem[];
}

interface EditLineItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  price: number;
  taxable: boolean;
}

const STATUSES = ["Draft", "Sent", "Paid", "Overdue"] as const;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

function formatDateForPreview(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusColor(status: string): string {
  switch (status) {
    case "Paid":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
    case "Sent":
      return "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
    case "Overdue":
      return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
}

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

// ─── Sortable Edit Line Item Row ──────────────────────────────────────────────

interface SortableEditLineItemProps {
  item: EditLineItem;
  lineWithGst: number;
  onUpdate: (id: string, field: keyof EditLineItem, value: string | number | boolean) => void;
  onRemove: (id: string) => void;
  formatCurrency: (n: number) => string;
}

function SortableEditLineItem({
  item,
  lineWithGst,
  onUpdate,
  onRemove,
  formatCurrency,
}: SortableEditLineItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* ─── Desktop table row (md+) ─────────────────────────────────── */}
      <div className="hidden md:grid grid-cols-[24px_1fr_70px_100px_100px_60px_100px_40px] gap-3 items-center p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none"
          tabIndex={-1}
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </button>
        <Input
          value={item.description}
          onChange={(e) => onUpdate(item.id, "description", e.target.value)}
          placeholder="Service or product"
          className="bg-background"
        />
        <Input
          type="number"
          min={0}
          step={0.5}
          value={item.qty}
          onChange={(e) => onUpdate(item.id, "qty", parseFloat(e.target.value) || 0)}
          className="bg-background"
        />
        <Select value={item.unit} onValueChange={(v) => onUpdate(item.id, "unit", v)}>
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
            onChange={(e) => onUpdate(item.id, "price", parseFloat(e.target.value) || 0)}
            className="pl-7 bg-background"
          />
        </div>
        <div className="flex justify-center">
          <Switch
            checked={item.taxable}
            onCheckedChange={(checked) => onUpdate(item.id, "taxable", checked)}
            aria-label="Apply GST to this item"
          />
        </div>
        <span className="text-sm font-medium text-right tabular-nums">
          {formatCurrency(lineWithGst)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          className="size-8 text-muted-foreground hover:text-red-500"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* ─── Mobile card layout (< md) ──────────────────────────────── */}
      <div className="md:hidden bg-background border border-border rounded-xl p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none p-1 min-h-[44px] flex items-center"
            tabIndex={-1}
            aria-label="Drag to reorder"
          >
            <GripVertical className="size-5" />
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(item.id)}
            className="text-muted-foreground hover:text-red-500 min-h-[44px]"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
        <Input
          value={item.description}
          onChange={(e) => onUpdate(item.id, "description", e.target.value)}
          placeholder="Service or product"
          className="bg-background mb-3 h-11"
        />
        <div className="flex gap-2 mb-3">
          <Input
            type="number"
            min={0}
            step={0.5}
            value={item.qty}
            onChange={(e) => onUpdate(item.id, "qty", parseFloat(e.target.value) || 0)}
            className="bg-background flex-1 min-w-0 h-11"
            placeholder="Qty"
          />
          <Select value={item.unit} onValueChange={(v) => onUpdate(item.id, "unit", v)}>
            <SelectTrigger className="bg-background flex-1 min-w-0 h-11">
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
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              $
            </span>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={item.price}
              onChange={(e) => onUpdate(item.id, "price", parseFloat(e.target.value) || 0)}
              className="pl-7 bg-background w-full h-11"
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Switch
              checked={item.taxable}
              onCheckedChange={(checked) => onUpdate(item.id, "taxable", checked)}
              aria-label="Apply GST to this item"
            />
            <span className="text-xs text-muted-foreground">GST</span>
          </div>
          <span className="text-base font-bold tabular-nums">
            {formatCurrency(lineWithGst)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main page content ────────────────────────────────────────────────────────

function InvoiceDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const { state: brandingState, load: loadBranding, setFieldImmediate } =
    useBranding();
  const bs = brandingState.settings;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Edit form state
  const [editClientId, setEditClientId] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editItems, setEditItems] = useState<EditLineItem[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [gstMode, setGstMode] = useState<"exclusive" | "inclusive">("exclusive");

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Close zoom modal on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewOpen(false);
    }
    if (previewOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  // Computed totals for edit mode (gstMode-aware)
  const rawSubtotal = useMemo(
    () => editItems.reduce((sum, item) => sum + item.qty * item.price, 0),
    [editItems]
  );
  const rawTaxableSubtotal = useMemo(
    () =>
      editItems
        .filter((i) => i.taxable)
        .reduce((sum, item) => sum + item.qty * item.price, 0),
    [editItems]
  );
  const { editSubtotal, editGst, editTotal } = useMemo(() => {
    if (gstMode === "exclusive") {
      const g = rawTaxableSubtotal * 0.1;
      return { editSubtotal: rawSubtotal, editGst: g, editTotal: rawSubtotal + g };
    } else {
      const exGst = rawTaxableSubtotal / 1.1;
      const g = rawTaxableSubtotal - exGst;
      const nonTaxable = rawSubtotal - rawTaxableSubtotal;
      return { editSubtotal: exGst + nonTaxable, editGst: g, editTotal: rawSubtotal };
    }
  }, [rawSubtotal, rawTaxableSubtotal, gstMode]);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch(`${API_BASE}/invoices/${invoiceId}`);
        if (!res.ok) throw new Error("Invoice not found");
        const data = await res.json();
        setInvoice(data);
      } catch {
        setError("Failed to load invoice. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [invoiceId]);

  useEffect(() => {
    fetchBranding().then(loadBranding).catch(() => { });
  }, [loadBranding]);

  function enterEditMode() {
    if (!invoice) return;
    setEditClientId(String(invoice.client_id));
    setEditDueDate(toDateInputValue(invoice.due_date));
    setEditStatus(invoice.status);
    setEditNotes(invoice.notes || "");
    setEditItems(
      invoice.items.map((item) => ({
        id: String(item.id),
        description: item.description,
        qty: item.quantity,
        unit: "item",
        price: item.unit_price,
        taxable: item.tax_rate > 0,
      }))
    );
    setClientsLoading(true);
    fetch(`${API_BASE}/clients/`)
      .then((r) => r.json())
      .then(setClients)
      .catch(() => { })
      .finally(() => setClientsLoading(false));
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function addItem() {
    setEditItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", qty: 1, unit: "item", price: 0, taxable: true },
    ]);
  }

  function removeItem(id: string) {
    setEditItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
  }

  function updateItem(
    id: string,
    field: keyof EditLineItem,
    value: string | number | boolean
  ) {
    setEditItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setEditItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  async function handleSave() {
    if (!editClientId) {
      alert("Please select a client.");
      return;
    }
    if (editItems.every((i) => !i.description.trim())) {
      alert("Please add at least one line item with a description.");
      return;
    }

    setSaving(true);
    const items = editItems
      .filter((i) => i.description.trim())
      .map((i) => ({
        description: i.description,
        quantity: i.qty,
        unit_price: i.price,
        tax_rate: i.taxable ? 0.1 : 0,
      }));

    try {
      const res = await fetch(`${API_BASE}/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: Number(editClientId),
          due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
          status: editStatus,
          notes: editNotes.trim() || null,
          items,
        }),
      });
      if (!res.ok) throw new Error("Failed to update invoice");
      const updated = await res.json();
      setInvoice(updated);
      setEditing(false);
    } catch {
      alert("Failed to save invoice.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this invoice? This cannot be undone."))
      return;
    try {
      const res = await fetch(`${API_BASE}/invoices/${invoiceId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/invoices");
    } catch {
      alert("Failed to delete invoice.");
    }
  }

  // Loading / Error states
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p className="text-destructive mb-4">{error || "Invoice not found"}</p>
        <Button variant="outline" asChild>
          <Link href="/invoices">Back to Invoices</Link>
        </Button>
      </div>
    );
  }

  const selectedClient = clients.find((c) => c.id === Number(editClientId));

  // ── Live preview data (built from edit state) ────────────────────────────────
  const livePreviewData = (() => {
    const issuedFormatted = formatDate(invoice.issue_date);
    const dueFormatted = editDueDate ? formatDateForPreview(editDueDate) : "No due date";

    const previewItems = editItems
      .filter((i) => i.description.trim())
      .map((item) => {
        const lineTotal = item.qty * item.price;
        const lineGst =
          item.taxable
            ? gstMode === "exclusive"
              ? lineTotal * 0.1
              : lineTotal - lineTotal / 1.1
            : 0;
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
      clientName: selectedClient?.name ?? invoice.client?.name,
      clientCompany: (selectedClient?.company ?? invoice.client?.company) ?? undefined,
      invoiceNumber: invoice.invoice_number,
      issued: issuedFormatted,
      due: dueFormatted,
      grandTotal: formatCurrency(editTotal),
      items: previewItems.length > 0 ? previewItems : undefined,
      subtotal: formatCurrency(editSubtotal),
      gst: formatCurrency(editGst),
      accentColor: bs.colour_graphical,
      headerLayout: bs.header_layout,
    };
  })();

  // ── EDIT MODE ─────────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="max-w-7xl mx-auto pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={cancelEdit}>
              <X className="size-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Edit {invoice.invoice_number}
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Modify invoice details
              </p>
            </div>
          </div>
          <div className="hidden md:flex gap-3">
            <Button variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button
              className="bg-brand-600 hover:bg-brand-700 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ══════════════════════════════════════════════════════════
              Left — Invoice Form
          ══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-4">
            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invoice Details</CardTitle>
                <CardDescription>Client and billing information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client *</Label>
                    <ClientCombobox
                      clients={clients}
                      value={editClientId}
                      onChange={setEditClientId}
                      loading={clientsLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Client Email</Label>
                    <p className="text-sm py-2 text-muted-foreground">
                      {selectedClient?.email || invoice.client?.email || "—"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due-date">Due Date</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
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
                  Services or products — GST at 10% ({gstMode === "exclusive" ? "exclusive" : "inclusive"})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Desktop column headers */}
                <div className="hidden md:grid grid-cols-[24px_1fr_70px_100px_100px_60px_100px_40px] gap-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
                  <span />
                  <span>Description</span>
                  <span>Qty</span>
                  <span>Unit</span>
                  <span>Price</span>
                  <span className="text-center">GST</span>
                  <span className="text-right">Total</span>
                  <span />
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={editItems.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {editItems.map((item) => {
                        const lineTotal = item.qty * item.price;
                        const lineGst = item.taxable
                          ? gstMode === "exclusive"
                            ? lineTotal * 0.1
                            : lineTotal - lineTotal / 1.1
                          : 0;
                        const lineWithGst =
                          gstMode === "exclusive" ? lineTotal + lineGst : lineTotal;
                        return (
                          <SortableEditLineItem
                            key={item.id}
                            item={item}
                            lineWithGst={lineWithGst}
                            onUpdate={updateItem}
                            onRemove={removeItem}
                            formatCurrency={formatCurrency}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>

                <Button
                  variant="ghost"
                  onClick={addItem}
                  className="mt-4 text-brand-600 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/20"
                >
                  <Plus className="size-4" />
                  Add Line Item
                </Button>

                <Separator className="my-6" />
                <div className="flex justify-end">
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="tabular-nums">{formatCurrency(editSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST (10%)</span>
                      <span className="tabular-nums">{formatCurrency(editGst)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span className="tabular-nums">{formatCurrency(editTotal)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ══════════════════════════════════════════════════════════
              Right — Sidebar
          ══════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            {/* Preview card */}
            <Card className="overflow-hidden hidden md:block">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Preview
                </CardTitle>
              </CardHeader>
              <button
                onClick={() => setPreviewOpen(true)}
                className="group relative w-full overflow-hidden bg-muted/30 block text-left"
                style={{ height: "320px" }}
                aria-label="Click to zoom preview"
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
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-2 text-white drop-shadow-lg">
                    <ZoomIn className="size-8" strokeWidth={1.5} />
                    <span className="text-xs font-medium tracking-wide">Zoom In</span>
                  </div>
                </div>
              </button>
            </Card>

            {/* Branding & Design */}
            <Card>
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Branding & Design
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
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

                <div className="space-y-2">
                  <Label className="text-xs">Header Layout</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["full_bar", "centred", "split"] as const).map((layout) => (
                      <button
                        key={layout}
                        onClick={() => setFieldImmediate("header_layout", layout)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-medium transition-all ${bs.header_layout === layout
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

            {/* GST Mode */}
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
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${gstMode === "exclusive"
                        ? "bg-brand-600 text-white"
                        : "bg-background text-muted-foreground hover:bg-muted"
                      }`}
                  >
                    Exclusive
                  </button>
                  <button
                    onClick={() => setGstMode("inclusive")}
                    className={`flex-1 py-2 text-sm font-medium border-l transition-colors ${gstMode === "inclusive"
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

        {/* Mobile: fixed action bar */}
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 flex gap-3 p-3 bg-background/95 backdrop-blur-sm border-t border-border">
          <Button variant="outline" onClick={cancelEdit} className="flex-1">
            Cancel
          </Button>
          <Button
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Changes
          </Button>
        </div>

        {/* Mobile: preview FAB */}
        <button
          onClick={() => setPreviewOpen(true)}
          className="md:hidden fixed right-4 bottom-36 z-30 size-12 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-200 dark:shadow-brand-900/50 transition-colors"
          aria-label="Preview invoice"
        >
          <ZoomIn className="size-5" strokeWidth={2} />
        </button>

        {/* Zoom Preview Modal */}
        {previewOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
            onClick={() => setPreviewOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Invoice preview"
          >
            <div
              className="relative max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
              style={{ width: "680px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewOpen(false)}
                className="absolute -top-4 -right-4 z-10 size-9 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close preview"
              >
                <X className="size-5" />
              </button>
              <div style={{ pointerEvents: "none" }}>
                <InvoicePreview invoiceData={livePreviewData} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleGetPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const res = await fetch(`${API_BASE}/invoices/${invoiceId}/pdf`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${invoice?.invoice_number ?? invoiceId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // ── VIEW MODE ─────────────────────────────────────────────────────────────────
  const cta = (() => {
    switch (invoice.status) {
      case "Paid": return { label: "Send receipt", Icon: Receipt };
      case "Sent": return { label: "Mark as paid", Icon: CheckCircle };
      case "Overdue": return { label: "Send reminder", Icon: AlertCircle };
      default: return { label: "Send invoice", Icon: Mail };
    }
  })();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header — back nav + invoice identity only */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {invoice.invoice_number}
            </h1>
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-0.5 rounded-full",
                statusColor(invoice.status)
              )}
            >
              {invoice.status}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Issued {formatDate(invoice.issue_date)}
          </p>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — branded invoice */}
        <div className="lg:col-span-2" id="invoice-pdf-container">
          <InvoicePreview
            invoiceData={{
              accentColor: invoice.accent_color ?? undefined,
              headerLayout: invoice.header_layout ?? undefined,
              clientName: invoice.client?.name,
              clientCompany: invoice.client?.company ?? undefined,
              invoiceNumber: invoice.invoice_number,
              issued: formatDate(invoice.issue_date),
              due: invoice.due_date ? formatDate(invoice.due_date) : "No due date",
              grandTotal: formatCurrency(invoice.total_amount),
              subtotal: formatCurrency(invoice.subtotal),
              gst: formatCurrency(invoice.tax_amount),
              items: invoice.items.map((item) => ({
                desc: item.description,
                qty: item.quantity,
                unit: "Unit",
                rate: formatCurrency(item.unit_price),
                gst: formatCurrency(item.amount * item.tax_rate),
                total: formatCurrency(item.amount),
              })),
            }}
          />
        </div>

        {/* Right — actions panel */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          {/* Primary CTA */}
          <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white">
            <cta.Icon className="size-4" />
            {cta.label}
          </Button>

          {/* Edit */}
          <Button variant="outline" className="w-full" onClick={enterEditMode}>
            <Pencil className="size-4" />
            Edit invoice
          </Button>

          {/* Options dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Options
                <ChevronDown className="size-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleGetPdf} disabled={isGeneratingPdf}>
                {isGeneratingPdf ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="size-4 mr-2" />
                )}
                {isGeneratingPdf ? "Generating PDF..." : "Get a PDF"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { }}>
                <Receipt className="size-4 mr-2" />
                Get receipt PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { }}>
                <Link2 className="size-4 mr-2" />
                Get share link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { }}>
                <Eye className="size-4 mr-2" />
                See client view
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { }}>
                <RotateCcw className="size-4 mr-2" />
                Revert to draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { }}>
                <Copy className="size-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Attach Files */}
          <div className="mt-1 rounded-lg border border-dashed border-muted-foreground/30 p-4 flex flex-col items-center gap-2 text-muted-foreground">
            <Paperclip className="size-5" />
            <p className="text-sm font-medium">Attach files</p>
            <p className="text-xs text-center">
              Upload receipts, photos or documents related to this invoice
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoiceDetailPage() {
  return (
    <BrandingProvider>
      <InvoiceDetailPageContent />
    </BrandingProvider>
  );
}
