import React from "react";
import { MoreHorizontal, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, statusColor, STATUSES } from "@/lib/invoiceUtils";
import { InvoiceGroup } from "@/types/invoice";

interface InvoiceMobileGroupCardProps {
  group: InvoiceGroup;
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
  onRowClick: (id: number) => void;
  updatingId: number | null;
}

function getInitials(name: string) {
  return name.substring(0, 2).toUpperCase();
}

export function InvoiceMobileGroupCard({
  group,
  onStatusChange,
  onDelete,
  onRowClick,
  updatingId,
}: InvoiceMobileGroupCardProps) {
  const clientName = group.client?.company || group.client?.name || "Unknown Client";
  const initials = getInitials(clientName);
  const activeInvoicesCount = group.invoices.filter(i => i.status !== 'Draft').length;

  return (
    <div className="mb-8">
      {/* Client Header Card */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
            {initials}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{clientName}</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {activeInvoicesCount} active invoice{activeInvoicesCount !== 1 && 's'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className={cn("text-[13px] font-bold", group.balance > 0 ? "text-red-500" : "text-slate-900")}>
            {formatCurrency(group.balance)}
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Balance</p>
        </div>
      </div>

      {/* Invoice Cards */}
      <div className="space-y-3">
        {group.invoices.map((inv) => (
          <div 
            key={inv.id}
            onClick={() => onRowClick(inv.id)}
            className={cn(
               "bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden",
               inv.status === 'Overdue' && "border-l-4 border-l-red-500"
            )}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={cn(
                "font-mono text-[13px] font-bold",
                inv.status === 'Overdue' ? 'text-red-500' : 'text-brand-500'
              )}>
                {inv.invoice_number || `#DRAFT-00${inv.id}`}
              </span>
              <span className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase",
                statusColor(inv.status)
              )}>
                {inv.status}
              </span>
            </div>

            <p className="text-[13px] font-semibold text-slate-700 mb-4 line-clamp-1">
              {inv.notes || "Standard Invoice"}
            </p>

            <div className="flex justify-between items-end">
               <div>
                  <p className="text-[10px] text-slate-400 font-medium mb-0.5">
                    {inv.status === 'Paid' ? 'Paid On' : inv.status === 'Overdue' ? 'Expired On' : inv.status === 'Draft' ? 'Last Edited' : 'Due Date'}
                  </p>
                  <p className={cn("text-[11px] font-bold", inv.status === 'Overdue' ? 'text-red-500' : 'text-slate-900')}>
                     {inv.status === 'Draft' ? 'Today' : formatDate(inv.issue_date)}
                  </p>
               </div>
               <div className="text-right flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <span className="text-lg font-bold text-slate-900 tabular-nums">
                     {formatCurrency(inv.total_amount)}
                  </span>
                  
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7 -mr-2 text-slate-400">
                           <MoreHorizontal className="size-4" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onStatusChange(inv.id, "Pending")}>
                           <Send className="size-4 mr-2" /> Mark as Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(inv.id, "Paid")}>
                           <span className="size-4 mr-2 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px]">✓</span> 
                           Mark as Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(inv.id)} className="text-red-600 focus:text-red-600">
                           <Trash2 className="size-4 mr-2" /> Delete
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
