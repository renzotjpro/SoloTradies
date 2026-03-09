"use client";

import { useState, useRef, useEffect } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const INDUSTRIES = [
  "Plumbing Services",
  "Electrical & Data Services",
  "Cleaning Services",
  "Carpentry & Joinery",
  "Gardening & Landscaping",
  "Painting & Decorating",
  "Handyman & Home Maintenance",
  "Building & Construction",
  "Tiling & Flooring",
  "Roofing & Guttering",
  "Air Conditioning & Refrigeration",
  "Concreting & Paving",
  "Fencing",
  "Glazing & Window Installation",
  "Plastering & Rendering",
  "Pool & Spa Services",
  "Security Systems",
  "Solar & Renewable Energy",
  "Pest Control",
  "Cabinet Making & Furniture",
  "Welding & Fabrication",
  "Earthmoving & Excavation",
  "IT & Computer Services",
  "Photography & Videography",
  "Other",
];

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function IndustryCombobox({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus the search input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    } else {
      setQuery("");
    }
  }, [open]);

  const filtered = query.trim()
    ? INDUSTRIES.filter((i) =>
        i.toLowerCase().includes(query.toLowerCase())
      )
    : INDUSTRIES;

  const showFreeText =
    query.trim().length > 0 &&
    !INDUSTRIES.some((i) => i.toLowerCase() === query.toLowerCase()) &&
    filtered.length === 0;

  function select(industry: string) {
    onChange(industry);
    setOpen(false);
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild disabled={disabled}>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            // Match Input styling exactly
            "border-input dark:bg-input/30 h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "flex items-center justify-between gap-2",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {value || "Select or type an industry…"}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
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
              placeholder="Search industries…"
              className="h-7 border-0 p-0 shadow-none focus-visible:ring-0 text-sm"
            />
          </div>

          {/* Options list */}
          <ul
            role="listbox"
            className="max-h-60 overflow-y-auto py-1"
          >
            {filtered.map((industry) => (
              <li
                key={industry}
                role="option"
                aria-selected={value === industry}
                onClick={() => select(industry)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
                  "hover:bg-accent hover:text-accent-foreground",
                  "select-none transition-colors"
                )}
              >
                <Check
                  className={cn(
                    "size-4 shrink-0",
                    value === industry ? "opacity-100" : "opacity-0"
                  )}
                />
                {industry}
              </li>
            ))}

            {/* Free-text fallback when no matches */}
            {showFreeText && (
              <li
                role="option"
                onClick={() => select(query.trim())}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
                  "hover:bg-accent hover:text-accent-foreground",
                  "select-none transition-colors text-muted-foreground"
                )}
              >
                <Check className="size-4 shrink-0 opacity-0" />
                Use: <span className="font-medium text-foreground ml-1">{query.trim()}</span>
              </li>
            )}

            {!showFreeText && filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                No results found.
              </li>
            )}
          </ul>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
