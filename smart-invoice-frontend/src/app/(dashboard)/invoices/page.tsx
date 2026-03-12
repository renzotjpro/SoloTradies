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
  LayoutGrid,
  List,
  Bell
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
import { authFetch } from "@/lib/api/authFetch";

// Shared imports
import { Invoice, InvoiceClient, InvoiceGroup } from "@/types/invoice";
import { formatCurrency, formatDate, statusColor, STATUSES } from "@/lib/invoiceUtils";
import { InvoiceGroupAccordion } from "@/components/invoices/InvoiceGroupAccordion";
import { InvoiceMobileGroupCard } from "@/components/invoices/InvoiceMobileGroupCard";

const TABS = [
  { key: "all", label: "All Invoices" },
  { key: "Paid", label: "Paid" },
  { key: "Pending", label: "Pending" },
  { key: "Overdue", label: "Overdue" },
  { key: "Draft", label: "Draft" },
] as const;

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"group" | "list">("group");

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await authFetch(`/invoices/`);
        if (!res.ok) throw new Error("Failed to fetch invoices");
        const data = await res.json();
        
        // Ensure legacy statuses like "Sent" are mapped to "Pending"
        const mappedData = data.map((inv: Invoice) => ({
          ...inv,
          status: inv.status === 'Sent' ? 'Pending' : inv.status
        }));
        
        setInvoices(mappedData);
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
    const counts: Record<string, number> = { all: invoices.length, Paid: 0, Pending: 0, Overdue: 0, Draft: 0 };
    invoices.forEach((inv) => {
      if (inv.status === "Paid") counts.Paid++;
      else if (inv.status === "Pending" || inv.status === "Sent") counts.Pending++;
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
        if (activeTab === "Pending") return inv.status === "Pending" || inv.status === "Sent";
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

  // Grouped Invoices
  const groupedInvoices = useMemo(() => {
    const map = new Map<number, InvoiceGroup>();
    filteredInvoices.forEach(inv => {
      const cId = inv.client?.id ?? 0; // Using 0 for "No Client"
      if (!map.has(cId)) {
        map.set(cId, { client: inv.client, invoices: [], balance: 0 });
      }
      const group = map.get(cId)!;
      group.invoices.push(inv);
      // Only sum balances for unpaid invoices
      if (inv.status !== "Paid" && inv.status !== "Draft") {
         group.balance += inv.total_amount;
      }
    });
    
    // Sort groups alphabetically by client name
    return Array.from(map.values()).sort((a, b) => {
      const nameA = a.client?.company || a.client?.name || "";
      const nameB = b.client?.company || b.client?.name || "";
      return nameA.localeCompare(nameB);
    });
  }, [filteredInvoices]);

  async function handleStatusChange(invoiceId: number, newStatus: string) {
    setUpdatingId(invoiceId);
    // Optimistic update
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: newStatus } : inv))
    );
    try {
      const res = await authFetch(`/invoices/${invoiceId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch {
      // Revert on failure — refetch
      const res = await authFetch(`/invoices/`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.map((inv: Invoice) => ({
          ...inv,
          status: inv.status === 'Sent' ? 'Pending' : inv.status
        })));
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(invoiceId: number) {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await authFetch(`/invoices/${invoiceId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete invoice");
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    } catch {
      alert("Failed to delete invoice.");
    }
  }

  const navigateToInvoice = (id: number) => {
    router.push(`/invoices/${id}`);
  };

  return (
    <div className="max-w-6xl mx-auto pb-32">
      {/* Top Utility Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Search invoices, clients, or IDs..."
            className="pl-11 h-10 bg-slate-50 border-transparent rounded-lg hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
           {/* View Toggle */}
           <div className="flex items-center bg-slate-50 rounded-lg p-1 h-10 shrink-0">
            <Button 
              variant={viewMode === "group" ? "default" : "ghost"}
              size="sm"
              className={`rounded-md h-full gap-2 px-3 font-medium text-sm transition-all ${viewMode === "group" ? "bg-white text-slate-900 shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}
              onClick={() => setViewMode("group")}
            >
              <LayoutGrid className="size-4" />
              <span className="hidden sm:inline">Group</span>
            </Button>
            <Button 
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className={`rounded-md h-full gap-2 px-3 font-medium text-sm transition-all ${viewMode === "list" ? "bg-white text-slate-900 shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}
              onClick={() => setViewMode("list")}
            >
              <List className="size-4" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500">
            <Bell className="size-4" />
          </Button>

          <Button asChild className="h-10 px-5 shrink-0 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm gap-2 shadow-sm transition-colors cursor-pointer">
            <Link href="/invoices/new">
              <Plus className="size-4" />
              Create Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 font-outfit tracking-tight">Invoice Management</h1>
        <p className="text-slate-500 text-sm font-medium">
          Track and manage your client billing cycles efficiently.
        </p>
      </div>

      {/* Modern Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 hide-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                isActive 
                  ? "bg-brand-600 text-white shadow-md shadow-brand-500/20" 
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              {tab.label}
              {tab.key !== "all" && (
                <span className={cn(
                  "ml-1.5 font-medium opacity-80"
                )}>
                  {statusCounts[tab.key] ?? 0}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Loading / Error States */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-8 animate-spin text-brand-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed border-red-200">
          <p className="text-red-500 font-bold mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry Connection
          </Button>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
          <div className="size-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6">
            <FileText className="size-8 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {invoices.length === 0 ? "No invoices yet" : "No results found"}
          </h2>
          <p className="text-sm text-slate-500 mb-8 max-w-sm">
            {invoices.length === 0
              ? "Create your first invoice to start tracking payments and managing your business finances."
              : "No invoices match your current search or filters. Try adjusting them."}
          </p>
          {invoices.length === 0 && (
            <Button
              asChild
              className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-6 h-11 pointer"
            >
              <Link href="/invoices/new">
                <Plus className="size-4 mr-2" />
                Create First Invoice
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Main Content Area */}
          {viewMode === "group" ? (
             <div className="animate-in fade-in duration-300">
                <div className="mb-4 md:hidden flex justify-between items-center px-1">
                   <span className="text-sm font-bold text-slate-900">Grouped by Client</span>
                   <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-brand-600">
                      Modify
                   </Button>
                </div>

                {groupedInvoices.map(group => (
                  <div key={group.client?.id || 'no-client'}>
                    <div className="hidden md:block">
                      <InvoiceGroupAccordion 
                        group={group} 
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        onRowClick={navigateToInvoice}
                        updatingId={updatingId}
                      />
                    </div>
                    <div className="md:hidden">
                      <InvoiceMobileGroupCard 
                        group={group}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        onRowClick={navigateToInvoice}
                        updatingId={updatingId}
                      />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold text-slate-400 uppercase h-10 px-6">Invoice ID</TableHead>
                    <TableHead className="text-xs font-bold text-slate-400 uppercase h-10">Client</TableHead>
                    <TableHead className="text-xs font-bold text-slate-400 uppercase h-10 text-right">Amount</TableHead>
                    <TableHead className="text-xs font-bold text-slate-400 uppercase h-10">Status</TableHead>
                    <TableHead className="text-xs font-bold text-slate-400 uppercase h-10 w-16 text-right px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer group hover:bg-slate-50 border-slate-100"
                      onClick={() => navigateToInvoice(inv.id)}
                    >
                      {/* Invoice number + date */}
                      <TableCell className="px-6 py-4">
                        <div className="font-mono text-sm font-bold text-slate-700">
                          {inv.invoice_number}
                        </div>
                        <div className="text-[11px] font-medium text-slate-400 mt-1">
                          {formatDate(inv.issue_date)}
                        </div>
                      </TableCell>

                      {/* Client */}
                      <TableCell className="py-4">
                        <div className="font-bold text-sm text-slate-900">
                          {inv.client?.company || inv.client?.name || "—"}
                        </div>
                        {inv.client?.email && (
                          <div className="text-[11px] font-medium text-slate-500 mt-1">
                            {inv.client.email}
                          </div>
                        )}
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="text-right py-4 font-bold text-slate-900">
                        {formatCurrency(inv.total_amount)}
                      </TableCell>

                      {/* Inline status select */}
                      <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={inv.status}
                          onValueChange={(value) => handleStatusChange(inv.id, value)}
                          disabled={updatingId === inv.id}
                        >
                          <SelectTrigger
                            className={cn(
                              "h-8 w-[110px] text-xs font-bold border-0 rounded-full px-3 shadow-none focus:ring-0",
                              statusColor(inv.status)
                            )}
                          >
                            <span className="w-2 h-2 rounded-full bg-current opacity-75 mr-1.5" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s} className="font-medium text-sm">
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                            >
                              <MoreHorizontal className="size-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem onClick={() => handleStatusChange(inv.id, "Pending")}>
                              <Send className="size-4 mr-2 text-slate-400" />
                              Send
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(inv.id)}
                              className="text-red-600 focus:text-red-700 focus:bg-red-50"
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
        </>
      )}
    </div>
  );
}
