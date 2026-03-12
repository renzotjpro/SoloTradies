import React, { useState } from "react";
import { ChevronDown, ChevronUp, MoreHorizontal, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, statusColor, STATUSES } from "@/lib/invoiceUtils";
import { InvoiceGroup } from "@/types/invoice";

interface InvoiceGroupAccordionProps {
  group: InvoiceGroup;
  defaultExpanded?: boolean;
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
  onRowClick: (id: number) => void;
  updatingId: number | null;
}

function getInitials(name: string) {
  return name.substring(0, 2).toUpperCase();
}

export function InvoiceGroupAccordion({
  group,
  defaultExpanded = true,
  onStatusChange,
  onDelete,
  onRowClick,
  updatingId,
}: InvoiceGroupAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const clientName = group.client?.company || group.client?.name || "Unknown Client";
  const initials = getInitials(clientName);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6">
      {/* Header */}
      <div 
        className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
            {initials}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{clientName}</h3>
            {group.client?.email && (
              <p className="text-sm text-slate-500">{group.client.email}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Balance</p>
            <p className={cn("text-lg font-bold", group.balance > 0 ? "text-red-500" : "text-slate-900")}>
              {formatCurrency(group.balance)}
            </p>
          </div>
          <div className="text-slate-400">
            {expanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
          </div>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="border-t border-slate-100">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold text-slate-400 uppercase h-10 px-6">Invoice ID</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 uppercase h-10">Description</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 uppercase h-10">Date</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 uppercase h-10 text-right">Amount</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 uppercase h-10">Status</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 uppercase h-10 w-16 text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.invoices.map((inv) => (
                <TableRow
                  key={inv.id}
                  className="cursor-pointer group hover:bg-slate-50 border-slate-100"
                  onClick={() => onRowClick(inv.id)}
                >
                  <TableCell className="px-6 py-4">
                    <span className="font-mono text-sm font-medium text-slate-600">
                      {inv.invoice_number}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm text-slate-600 font-medium">
                      {inv.notes || "Standard Invoice"}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm text-slate-500">
                      {formatDate(inv.issue_date)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(inv.total_amount)}
                    </span>
                  </TableCell>
                  <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={inv.status}
                      onValueChange={(value) => onStatusChange(inv.id, value)}
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
                        <DropdownMenuItem onClick={() => onStatusChange(inv.id, "Pending")}>
                          <Send className="size-4 mr-2 text-slate-400" />
                          Send
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(inv.id)}
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
    </div>
  );
}
