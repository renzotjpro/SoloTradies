"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreVertical, Mail, Phone, Hash } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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

interface ClientCardProps {
  client: Client;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ClientCard({ 
  client, 
  selected, 
  onSelect, 
  onEdit, 
  onDelete 
}: ClientCardProps) {
  const isOverdue = (client.overdue_balance ?? 0) > 0;

  return (
    <Card className="relative hover:shadow-lg transition-all duration-300 border-border group overflow-hidden">
      <CardContent className="p-6">
        {/* Card Header */}
        <div className="flex justify-between items-start mb-6">
          <Checkbox 
            checked={selected} 
            onCheckedChange={(checked: boolean | "indeterminate") => onSelect(checked === true)}
            className="mt-1"
          />
          
          <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
            {/* Logo/Avatar Placeholder */}
            {client.company ? (
               <span className="text-xl font-bold text-slate-400">
                 {client.company.charAt(0).toUpperCase()}
               </span>
            ) : (
               <span className="text-xl font-bold text-slate-400">
                 {client.name.charAt(0).toUpperCase()}
               </span>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Edit Client</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>Delete Client</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Client Info */}
        <div className="space-y-1 mb-6">
          <h3 className="text-lg font-bold text-slate-900 truncate">
            {client.company || client.name}
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            {client.location || "Sydney, NSW"}
          </p>
        </div>

        {/* Contact Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="size-4 text-slate-400" />
            <span className="text-sm truncate">{client.email || "No email provided"}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="size-4 text-slate-400" />
            <span className="text-sm">{client.phone || "No phone provided"}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Hash className="size-4 text-slate-400" />
            <span className="text-sm">ABN: {client.abn || "Not provided"}</span>
          </div>
        </div>

        <Separator className="mb-4 bg-slate-100" />

        {/* Financial Summary */}
        <div className="flex flex-col gap-1">
          {isOverdue && (
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Overdue:</span>
          )}
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</span>
            <span className={`text-lg font-bold ${isOverdue ? 'text-red-500' : 'text-slate-900'}`}>
              ${(client.overdue_balance || client.balance || 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
