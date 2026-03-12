"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { MoreVertical, Mail, Phone, Hash } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Client {
  id: number;
  name: string;
  company: string | null;
  location?: string;
  email: string | null;
  phone: string | null;
  abn: string | null;
  balance?: number;
  overdue_balance?: number;
}

interface ClientListRowProps {
  client: Client;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ClientListRow({ 
  client, 
  selected, 
  onSelect, 
  onEdit, 
  onDelete 
}: ClientListRowProps) {
  const isOverdue = (client.overdue_balance ?? 0) > 0;

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 group">
      <Checkbox 
        checked={selected} 
        onCheckedChange={(checked: boolean | "indeterminate") => onSelect(checked === true)}
      />
      
      {/* Avatar & Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
           <span className="text-sm font-bold text-slate-400">
             {(client.company || client.name).charAt(0).toUpperCase()}
           </span>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 truncate">
            {client.company || client.name}
          </p>
          <p className="text-xs text-slate-500 font-medium truncate">
            {client.location || "Sydney, NSW"}
          </p>
        </div>
      </div>

      {/* Contact */}
      <div className="flex-[1.5] hidden md:flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-600 min-w-0">
          <Mail className="size-4 text-slate-400 shrink-0" />
          <span className="text-sm truncate">{client.email || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 shrink-0">
          <Phone className="size-4 text-slate-400 shrink-0" />
          <span className="text-sm">{client.phone || "—"}</span>
        </div>
      </div>

      {/* ABN */}
      <div className="flex-1 hidden lg:flex items-center gap-2 text-slate-600 shrink-0">
        <Hash className="size-4 text-slate-400 shrink-0" />
        <span className="text-sm truncate">ABN: {client.abn || "—"}</span>
      </div>

      {/* Balance */}
      <div className="flex-1 flex flex-col items-end shrink-0">
        {isOverdue && (
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Overdue</span>
        )}
        <span className={`text-sm font-bold ${isOverdue ? 'text-red-500' : 'text-slate-900'}`}>
          ${(client.overdue_balance || client.balance || 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>Edit Client</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={onDelete}>Delete Client</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
