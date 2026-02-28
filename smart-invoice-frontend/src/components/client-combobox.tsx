"use client";

import { useState, useRef, useEffect } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ClientOption {
  id: number;
  name: string;
  email: string | null;
  company: string | null;
}

type Props = {
  clients: ClientOption[];
  value: string;        // selected client ID as string, "" = none
  onChange: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
};

export function ClientCombobox({ clients, value, onChange, loading, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    } else {
      setQuery("");
    }
  }, [open]);

  const selected = clients.find((c) => String(c.id) === value);

  const filtered = query.trim()
    ? clients.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.company ?? "").toLowerCase().includes(q)
        );
      })
    : clients;

  function select(clientId: string) {
    onChange(clientId);
    setOpen(false);
  }

  // Empty state — no clients in DB at all
  if (!loading && clients.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        No clients found.{" "}
        <Link href="/clients/new" className="text-brand-600 hover:underline">
          Add a client first
        </Link>
      </div>
    );
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild disabled={disabled || loading}>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "border-input dark:bg-input/30 h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "flex items-center justify-between gap-2",
            !selected && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {loading
              ? "Loading clients…"
              : selected
              ? selected.name
              : "Select a client…"}
          </span>
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={4}
          align="start"
          className={cn(
            "bg-popover text-popover-foreground z-50 rounded-md border shadow-md",
            "w-[var(--radix-popover-trigger-width)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2"
          )}
        >
          {/* Search bar */}
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or company…"
              className="h-7 border-0 p-0 shadow-none focus-visible:ring-0 text-sm"
            />
          </div>

          {/* Options list */}
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.map((client) => (
              <li
                key={client.id}
                role="option"
                aria-selected={String(client.id) === value}
                onClick={() => select(String(client.id))}
                className={cn(
                  "flex cursor-pointer items-start gap-2 px-3 py-2 text-sm",
                  "hover:bg-accent hover:text-accent-foreground",
                  "select-none transition-colors"
                )}
              >
                <Check
                  className={cn(
                    "size-4 mt-0.5 shrink-0",
                    String(client.id) === value ? "opacity-100" : "opacity-0"
                  )}
                />
                <div>
                  <p className="font-medium leading-tight">{client.name}</p>
                  {client.company && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {client.company}
                    </p>
                  )}
                </div>
              </li>
            ))}

            {/* No search results */}
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-center text-sm text-muted-foreground">
                No clients match &ldquo;{query}&rdquo;.{" "}
                <Link
                  href="/clients/new"
                  className="text-brand-600 hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Add a new client
                </Link>
              </li>
            )}
          </ul>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
