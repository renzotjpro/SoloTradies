"use client";

import Link from "next/link";
import { Plus, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function InvoicesPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and track all your invoices
          </p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href="/invoices/new">
            <Plus className="size-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
          className="pl-10 max-w-sm"
          disabled
        />
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <FileText className="size-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          No invoices yet
        </h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Create your first invoice to start tracking payments and managing your
          business finances.
        </p>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href="/invoices/new">
            <Plus className="size-4" />
            Create Invoice
          </Link>
        </Button>
      </div>
    </div>
  );
}
