"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Pencil,
  X,
  Trash2,
  Plus,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  items: InvoiceItem[];
}

interface EditLineItem {
  id: string;
  description: string;
  qty: number;
  price: number;
  tax_rate: number;
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

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editClientId, setEditClientId] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editItems, setEditItems] = useState<EditLineItem[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);

  // Computed totals for edit mode
  const editSubtotal = useMemo(
    () => editItems.reduce((sum, item) => sum + item.qty * item.price, 0),
    [editItems]
  );
  const editGst = useMemo(() => editSubtotal * 0.1, [editSubtotal]);
  const editTotal = useMemo(() => editSubtotal + editGst, [editSubtotal, editGst]);

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
        price: item.unit_price,
        tax_rate: item.tax_rate,
      }))
    );
    // Fetch clients for the dropdown
    fetch(`${API_BASE}/clients/`)
      .then((r) => r.json())
      .then(setClients)
      .catch(() => {});
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function addItem() {
    setEditItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", qty: 1, price: 0, tax_rate: 0.1 },
    ]);
  }

  function removeItem(id: string) {
    setEditItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
  }

  function updateItem(id: string, field: keyof EditLineItem, value: string | number) {
    setEditItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
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
        tax_rate: i.tax_rate,
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

  // ── EDIT MODE ──
  if (editing) {
    return (
      <div className="max-w-3xl mx-auto">
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
          <div className="flex gap-3">
            <Button variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button
              className="bg-brand-600 hover:bg-brand-700 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Client & Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Details</CardTitle>
              <CardDescription>Client and billing information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client *</Label>
                  {clients.length > 0 ? (
                    <Select value={editClientId} onValueChange={setEditClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                            {c.company ? ` — ${c.company}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">Loading clients...</p>
                  )}
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
              <CardDescription>Services or products — GST at 10%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="hidden md:grid grid-cols-[1fr_80px_100px_60px_100px_40px] gap-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
                <span>Description</span>
                <span>Qty</span>
                <span>Price</span>
                <span>GST</span>
                <span className="text-right">Total</span>
                <span />
              </div>

              <div className="space-y-3">
                {editItems.map((item) => {
                  const lineTotal = item.qty * item.price;
                  const lineGst = lineTotal * 0.1;
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-[1fr_80px_100px_60px_100px_40px] gap-3 items-center p-3 rounded-lg bg-muted/40"
                    >
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
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
                            updateItem(item.id, "price", parseFloat(e.target.value) || 0)
                          }
                          className="pl-7 bg-background"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground text-center">10%</span>
                      <span className="text-sm font-medium text-right tabular-nums">
                        {formatCurrency(lineTotal + lineGst)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="size-8 text-muted-foreground hover:text-red-500"
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
      </div>
    );
  }

  // ── VIEW MODE ──
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
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
        <div className="flex gap-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
          <Button
            className="bg-brand-600 hover:bg-brand-700 text-white"
            size="sm"
            onClick={enterEditMode}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Client & Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Client</p>
                <p className="text-sm font-medium">
                  {invoice.client?.company || invoice.client?.name || "—"}
                </p>
                {invoice.client?.email && (
                  <p className="text-xs text-muted-foreground">{invoice.client.email}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Status</p>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    statusColor(invoice.status)
                  )}
                >
                  {invoice.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Issue Date</p>
                <p className="text-sm">{formatDate(invoice.issue_date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Due Date</p>
                <p className="text-sm">
                  {invoice.due_date ? formatDate(invoice.due_date) : "—"}
                </p>
              </div>
            </div>
            {invoice.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground font-medium mb-1">Notes</p>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">GST</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => {
                    const itemGst = item.amount * item.tax_rate;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.description}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(itemGst)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatCurrency(item.amount + itemGst)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <Separator className="my-6" />
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (10%)</span>
                  <span className="tabular-nums">{formatCurrency(invoice.tax_amount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(invoice.total_amount)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
