"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  FileText,
  Send,
  Save,
  DollarSign,
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

interface LineItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  price: number;
}

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

export default function NewInvoicePage() {
  const router = useRouter();

  // Header fields
  const [invoiceNumber] = useState(generateInvoiceNumber);
  const [issueDate, setIssueDate] = useState(formatDate(new Date()));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return formatDate(d);
  });

  // Business info
  const [businessName, setBusinessName] = useState("Your Business Name");
  const [businessAddress, setBusinessAddress] = useState(
    "123 Main Street, Sydney NSW 2000"
  );

  // Client info
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");

  // Line items
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", qty: 1, unit: "hour", price: 0 },
  ]);

  // Submission state
  const [saving, setSaving] = useState(false);

  // Computed totals
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.qty * item.price, 0),
    [items]
  );
  const gst = useMemo(() => subtotal * 0.1, [subtotal]);
  const total = useMemo(() => subtotal + gst, [subtotal, gst]);

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

  async function handleSave(status: string) {
    if (!clientName.trim()) {
      alert("Please enter a client name.");
      return;
    }
    if (items.every((i) => !i.description.trim())) {
      alert("Please add at least one line item with a description.");
      return;
    }

    setSaving(true);

    const description = items
      .filter((i) => i.description.trim())
      .map((i) => `${i.description} (${i.qty} ${i.unit} × $${i.price.toFixed(2)})`)
      .join("; ");

    try {
      const res = await fetch("http://localhost:8000/invoices/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_number: invoiceNumber,
          description,
          amount: total,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          status,
          client_id: 1,
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

  return (
    <div className="max-w-7xl mx-auto">
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
        {/* Left — Invoice Form */}
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
                    <div>
                      <Input
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="font-semibold text-lg border-none shadow-none p-0 h-auto focus-visible:ring-0"
                        placeholder="Business Name"
                      />
                    </div>
                  </div>
                  <Input
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="text-sm text-muted-foreground border-none shadow-none p-0 h-auto focus-visible:ring-0"
                    placeholder="Business Address"
                  />
                </div>

                {/* Invoice Meta */}
                <div className="space-y-3 min-w-[200px]">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Invoice Number
                    </Label>
                    <p className="font-mono font-semibold text-sm mt-1">
                      {invoiceNumber}
                    </p>
                  </div>
                  <div>
                    <Label
                      htmlFor="issue-date"
                      className="text-xs text-muted-foreground uppercase tracking-wider"
                    >
                      Issue Date
                    </Label>
                    <Input
                      id="issue-date"
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
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
                  <Label htmlFor="client-name">Client Name *</Label>
                  <Input
                    id="client-name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-email">Client Email</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
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
                Add services or products — GST is calculated at 10%
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[1fr_80px_100px_100px_60px_100px_40px] gap-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
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
                  const lineGst = lineTotal * 0.1;
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-[1fr_80px_100px_100px_60px_100px_40px] gap-3 items-center p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
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
                      <span className="text-sm text-muted-foreground text-center">
                        10%
                      </span>
                      <span className="text-sm font-medium text-right tabular-nums">
                        {formatCurrency(lineTotal + lineGst)}
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
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST (10%)</span>
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
        </div>

        {/* Right — Settings Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Currency */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-muted-foreground" />
                  <span className="text-sm">Currency</span>
                </div>
                <span className="text-sm font-medium bg-muted px-2.5 py-0.5 rounded-md">
                  AUD ($)
                </span>
              </div>
              <Separator />

              {/* GST Info */}
              <div className="flex items-center justify-between">
                <span className="text-sm">GST Rate</span>
                <span className="text-sm font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 px-2.5 py-0.5 rounded-md">
                  10%
                </span>
              </div>
              <Separator />

              {/* Summary */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Quick Summary
                </p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items</span>
                    <span>{items.filter((i) => i.description.trim()).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Client</span>
                    <span className="truncate max-w-[120px]">
                      {clientName || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span className="text-brand-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="border-brand-200 dark:border-brand-800/40">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                  <FileText className="size-4 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">ATO Compliant</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This invoice includes 10% GST as required by the Australian Tax
                    Office for registered businesses.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
