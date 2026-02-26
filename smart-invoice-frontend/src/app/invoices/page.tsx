"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Search,
  Loader2,
  MoreHorizontal,
  Send,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API_BASE = "http://localhost:8000";

interface InvoiceClient {
  id: number;
  name: string;
  email: string | null;
  company: string | null;
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
  client: InvoiceClient | null;
  notes: string | null;
}

const STATUSES = ["Draft", "Sent", "Paid", "Overdue"] as const;

const TABS = [
  { key: "all", label: "All Invoices" },
  { key: "Paid", label: "Paid" },
  { key: "Unpaid", label: "Unpaid" },
  { key: "Overdue", label: "Overdue" },
  { key: "Draft", label: "Draft" },
] as const;

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

function statusColor(status: string): string {
  switch (status) {
    case "Paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
    case "Sent":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
    case "Overdue":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700";
  }
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch(`${API_BASE}/invoices/`);
        if (!res.ok) throw new Error("Failed to fetch invoices");
        const data = await res.json();
        setInvoices(data);
      } catch {
        setError("Failed to load invoices. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  // Tab counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: invoices.length, Paid: 0, Unpaid: 0, Overdue: 0, Draft: 0 };
    invoices.forEach((inv) => {
      if (inv.status === "Paid") counts.Paid++;
      else if (inv.status === "Sent") counts.Unpaid++;
      else if (inv.status === "Overdue") counts.Overdue++;
      else if (inv.status === "Draft") counts.Draft++;
    });
    return counts;
  }, [invoices]);

  // Filter by tab + search
  const filteredInvoices = useMemo(() => {
    let result = invoices;
    if (activeTab !== "all") {
      result = result.filter((inv) => {
        if (activeTab === "Unpaid") return inv.status === "Sent";
        return inv.status === activeTab;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(q) ||
          inv.status.toLowerCase().includes(q) ||
          inv.client?.name?.toLowerCase().includes(q) ||
          inv.client?.company?.toLowerCase().includes(q) ||
          inv.client?.email?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, invoices, activeTab]);

  async function handleStatusChange(invoiceId: number, newStatus: string) {
    setUpdatingId(invoiceId);
    // Optimistic update
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: newStatus } : inv))
    );
    try {
      const res = await fetch(`${API_BASE}/invoices/${invoiceId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch {
      // Revert on failure — refetch
      const res = await fetch(`${API_BASE}/invoices/`);
      if (res.ok) setInvoices(await res.json());
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(invoiceId: number) {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`${API_BASE}/invoices/${invoiceId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete invoice");
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    } catch {
      alert("Failed to delete invoice.");
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and track all your invoices
          </p>
        </div>
        <Button asChild className="bg-brand-600 hover:bg-brand-700 text-white">
          <Link href="/invoices/new">
            <Plus className="size-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.key
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.key !== "all" && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({statusCounts[tab.key] ?? 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by invoice, client, or status..."
          className="pl-10 max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <FileText className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {invoices.length === 0 ? "No invoices yet" : "No results"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {invoices.length === 0
              ? "Create your first invoice to start tracking payments and managing your business finances."
              : "No invoices match your search or filter. Try a different term."}
          </p>
          {invoices.length === 0 && (
            <Button
              asChild
              className="bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Link href="/invoices/new">
                <Plus className="size-4" />
                Create Invoice
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => (
                <TableRow
                  key={inv.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/invoices/${inv.id}`)}
                >
                  {/* Invoice number + date */}
                  <TableCell>
                    <div className="font-medium font-mono">
                      {inv.invoice_number}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(inv.issue_date)}
                    </div>
                  </TableCell>

                  {/* Client */}
                  <TableCell>
                    <div className="font-medium">
                      {inv.client?.company || inv.client?.name || "—"}
                    </div>
                    {inv.client?.email && (
                      <div className="text-xs text-muted-foreground">
                        {inv.client.email}
                      </div>
                    )}
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(inv.total_amount)}
                  </TableCell>

                  {/* Inline status select */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={inv.status}
                      onValueChange={(value) =>
                        handleStatusChange(inv.id, value)
                      }
                      disabled={updatingId === inv.id}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-7 w-[110px] text-xs font-medium border rounded-full px-3",
                          statusColor(inv.status)
                        )}
                      >
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
                  </TableCell>

                  {/* Actions */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(inv.id, "Sent")
                          }
                        >
                          <Send className="size-4 mr-2" />
                          Send
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(inv.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
