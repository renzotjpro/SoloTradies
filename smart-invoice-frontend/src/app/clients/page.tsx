"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Client {
  id: number;
  name: string;
  role: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  abn: string | null;
}

const API_BASE = "http://localhost:8000";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch(`${API_BASE}/clients/`);
        if (!res.ok) throw new Error("Failed to fetch clients");
        const data = await res.json();
        setClients(data);
      } catch {
        setError("Failed to load clients. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.company?.toLowerCase().includes(q) ?? false) ||
        (c.email?.toLowerCase().includes(q) ?? false)
    );
  }, [search, clients]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Clients</h1>
        <Button asChild className="bg-brand-600 hover:bg-brand-700 text-white">
          <Link href="/clients/new">
            <Plus className="size-4" />
            New client
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, company, or email..."
          className="pl-10 max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Loading / Error / Content */}
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
      ) : filteredClients.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Users className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {clients.length === 0 ? "No clients yet" : "No results"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {clients.length === 0
              ? "Add your first client to start creating invoices."
              : "No clients match your search. Try a different term."}
          </p>
          {clients.length === 0 && (
            <Button asChild className="bg-brand-600 hover:bg-brand-700 text-white">
              <Link href="/clients/new">
                <Plus className="size-4" />
                Add Client
              </Link>
            </Button>
          )}
        </div>
      ) : (
        /* Client grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}/edit`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  {/* Avatar + Name + Role */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-11 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-brand-700 dark:text-brand-400">
                        {getInitials(client.name)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {client.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {client.role || "—"}
                      </p>
                    </div>
                  </div>

                  <Separator className="mb-4" />

                  {/* 2×2 detail grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        Company
                      </p>
                      <p className="text-sm truncate">
                        {client.company || "—"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        Email
                      </p>
                      <p className="text-sm truncate">
                        {client.email || "—"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        Phone
                      </p>
                      <p className="text-sm">{client.phone || "—"}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        ABN
                      </p>
                      <p className="text-sm">{client.abn || "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
