"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Loader2, Users, LayoutGrid, List, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authFetch } from "@/lib/api/authFetch";
import { ClientCard } from "@/components/clients/ClientCard";
import { ClientListRow } from "@/components/clients/ClientListRow";
import { BulkActionToolbar } from "@/components/clients/BulkActionToolbar";
import { AddClientCard } from "@/components/clients/AddClientCard";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface Client {
  id: number;
  name: string;
  role: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  abn: string | null;
  state: string | null;
  balance?: number;
  overdue_balance?: number;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "recent">("name-asc");

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await authFetch(`/clients/`);
        if (!res.ok) throw new Error("Failed to fetch clients");
        const data = await res.json();
        // Simulate balances for the premium design feel
        const enrichedData = data.map((c: Client) => ({
          ...c,
          location: c.state ? `City, ${c.state}` : "Sydney, NSW",
          balance: Math.random() * 50000,
          overdue_balance: Math.random() > 0.8 ? Math.random() * 10000 : 0
        }));
        setClients(enrichedData);
      } catch {
        setError("Failed to load clients. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  const sortedAndFilteredClients = useMemo(() => {
    let result = [...clients];
    
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.company?.toLowerCase().includes(q) ?? false) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          (c.abn?.includes(q) ?? false)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      return 0; // "recent" would need a proper date field
    });

    return result;
  }, [search, clients, sortBy]);

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(sortedAndFilteredClients.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: number, selected: boolean) => {
    const next = new Set(selectedIds);
    if (selected) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-32">
      {/* Utility Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
        <div className="relative flex-1 w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Search clients by name, company or ABN..."
            className="pl-11 h-10 bg-slate-50 border-transparent rounded-full hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-50 rounded-full p-1 h-10">
            <Button 
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className={`rounded-full h-full gap-2 px-4 font-medium text-sm ${viewMode === "grid" ? "bg-white text-slate-900 shadow-sm hover:bg-white hover:text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="size-4" />
              Grid
            </Button>
            <Button 
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className={`rounded-full h-full gap-2 px-4 font-medium text-sm ${viewMode === "list" ? "bg-white text-slate-900 shadow-sm hover:bg-white hover:text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}
              onClick={() => setViewMode("list")}
            >
              <List className="size-4" />
              List
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500">
            <Users className="size-4" />
          </Button>

          <Button className="h-10 px-5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm gap-2 shadow-sm transition-colors">
            <Plus className="size-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex items-end justify-between mb-8 group">
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Client Directory</h1>
            <p className="text-slate-500 text-lg font-medium">
              Manage and monitor your business relationships with <span className="text-slate-900 font-bold">{clients.length}</span> total clients.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
            <Checkbox 
               checked={selectedIds.size === sortedAndFilteredClients.length && sortedAndFilteredClients.length > 0}
               onCheckedChange={(checked) => toggleSelectAll(!!checked)}
            />
            SELECT ALL
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 px-4 rounded-xl border-slate-200 text-slate-600 font-bold gap-8">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4" />
                  Sort: {sortBy === "name-asc" ? "A-Z" : sortBy === "name-desc" ? "Z-A" : "Recent"}
                </div>
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("name-asc")}>Alphabetical (A-Z)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name-desc")}>Reverse Alphabetical (Z-A)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("recent")}>Recent</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 px-4 rounded-xl border-slate-200 text-slate-600 font-bold gap-8">
                <div className="flex items-center gap-2">
                  <History className="size-4" />
                  Sort: Recent
                </div>
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Last Week</DropdownMenuItem>
              <DropdownMenuItem>Last Month</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-40">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-12 animate-spin text-blue-600" />
            <p className="text-slate-500 font-bold">Loading clients...</p>
          </div>
        </div>
      ) : sortedAndFilteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-3xl border border-dashed border-slate-200">
          <Users className="size-16 text-slate-200 mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No clients found</h2>
          <p className="text-slate-500 mb-8 max-w-sm text-center">
            Trying adjusting your search or add a new client to get started.
          </p>
          <Button className="rounded-xl bg-blue-600 px-8 h-12 font-bold shadow-lg shadow-blue-200">
            Add Your First Client
          </Button>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {sortedAndFilteredClients.map((client) => (
                <ClientCard 
                  key={client.id} 
                  client={client}
                  selected={selectedIds.has(client.id)}
                  onSelect={(selected) => toggleSelect(client.id, selected)}
                  onEdit={() => router.push(`/clients/${client.id}/edit`)}
                  onDelete={() => {}}
                />
              ))}
              <AddClientCard />
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {sortedAndFilteredClients.map((client) => (
                <ClientListRow 
                  key={client.id}
                  client={client}
                  selected={selectedIds.has(client.id)}
                  onSelect={(selected) => toggleSelect(client.id, selected)}
                  onEdit={() => router.push(`/clients/${client.id}/edit`)}
                  onDelete={() => {}}
                />
              ))}
            </div>
          )}

          {/* Pagination Footer */}
          <div className="mt-12 flex items-center justify-between">
            <p className="text-slate-500 font-medium">
              Showing <span className="text-slate-900 font-bold">6</span> of <span className="text-slate-900 font-bold">{clients.length}</span> clients
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg text-slate-400">
                <ChevronLeft className="size-5" />
              </Button>
              <div className="flex items-center gap-1">
                <Button className="h-10 w-10 rounded-lg bg-blue-600 font-bold">1</Button>
                <Button variant="ghost" className="h-10 w-10 rounded-lg font-bold text-slate-500">2</Button>
                <Button variant="ghost" className="h-10 w-10 rounded-lg font-bold text-slate-500">3</Button>
                <span className="px-2 text-slate-400">...</span>
                <Button variant="ghost" className="h-10 w-10 rounded-lg font-bold text-slate-500">7</Button>
              </div>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg text-slate-400">
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Floating Toolbar */}
      <BulkActionToolbar 
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onEmail={() => {}}
        onExport={() => {}}
        onDelete={() => {}}
      />
    </div>
  );
}
