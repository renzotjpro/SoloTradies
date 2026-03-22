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

export type ClientCardVariant = "compact-v1" | "compact-v2";

interface ClientCardProps {
  client: Client;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  variant?: ClientCardVariant;
}

export function ClientCard({ 
  client, 
  selected, 
  onSelect, 
  onEdit, 
  onDelete, 
  variant = "compact-v2" 
}: ClientCardProps) {
  const isOverdue = (client.overdue_balance ?? 0) > 0;
  const isCompactV1 = variant === "compact-v1";
  const isCompactV2 = variant === "compact-v2";
  const isCompact = true; // Both remaining variants are compact compared to the original standard

  return (
    <>
      {/* Desktop Card (Grid) */}
      <Card className={`relative hover:shadow-lg transition-all duration-300 border-border group overflow-hidden hidden md:block ${isCompactV2 ? 'min-h-[200px]' : ''}`}>
        <CardContent className={isCompactV2 ? "p-4" : isCompactV1 ? "p-4" : "p-6"}>
          {/* Card Header & Identity */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex gap-3 items-start">
              <Checkbox 
                checked={selected} 
                onCheckedChange={(checked: boolean | "indeterminate") => onSelect(checked === true)}
                className="mt-0.5"
              />
              
              {isCompactV2 && (
                <div className="flex gap-3">
                  <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                    <span className="text-sm font-bold text-slate-400">
                      {(client.company || client.name).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">
                      {client.company || client.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      {client.location || "Sydney, NSW"}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {!isCompactV2 && (
              <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                {/* Logo/Avatar Placeholder */}
                <span className="text-lg font-bold text-slate-400">
                  {(client.company || client.name).charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 -mr-2 -mt-1">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>Edit Client</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>Delete Client</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Client Info (Visible in Standard) */}
          {!isCompactV2 && (
            <div className="space-y-0.5 mb-4 text-center">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {client.company || client.name}
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                {client.location || "Sydney, NSW"}
              </p>
            </div>
          )}

          {/* Contact Details */}
          <div className="grid grid-cols-1 gap-1.5 mb-4">
            <div className="flex items-center gap-2 text-slate-600 min-w-0">
              <Mail className="size-3 text-slate-400 shrink-0" />
              <span className="text-[12px] truncate">{client.email || "No email"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="size-3 text-slate-400 shrink-0" />
              <span className="text-[12px]">{client.phone || "No phone"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Hash className="size-3 text-slate-400 shrink-0" />
              <span className="text-[12px]">ABN: {client.abn || "None"}</span>
            </div>
          </div>

          <Separator className="mb-3 bg-slate-100" />

          {/* Financial Summary */}
          <div className="flex flex-col gap-0.5">
            {isOverdue && (
              <span className="text-[8px] font-bold text-red-500 uppercase tracking-wider">Overdue:</span>
            )}
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Balance</span>
              <span className={`font-bold text-base ${isOverdue ? 'text-red-500' : 'text-slate-900'}`}>
                ${(client.overdue_balance || client.balance || 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card (List Item) - Based on Stitch Design */}
      <Card className="md:hidden border-slate-100 shadow-sm mb-3">
        <CardContent className="p-4 flex gap-3 items-start">
          <div className="pt-3">
            <Checkbox 
              checked={selected} 
              onCheckedChange={(checked: boolean | "indeterminate") => onSelect(checked === true)}
              className="size-5 rounded border-slate-300 data-[state=checked]:bg-brand-600 data-[state=checked]:border-brand-600"
            />
          </div>

          <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
            <span className="text-lg font-bold text-slate-400">
              {(client.company || client.name).charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">
                  {client.company || client.name}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium truncate mb-1">
                  {client.location || "Sydney, NSW"}
                </p>
              </div>
              <div className="text-right flex flex-col items-end">
                {isOverdue && (
                  <p className="text-[9px] font-bold text-red-500 uppercase leading-none mb-0.5">
                    OVERDUE: ${(client.overdue_balance || 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </p>
                )}
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">
                  BALANCE
                </p>
                <p className={`text-sm font-bold ${isOverdue ? 'text-red-500' : 'text-slate-900'}`}>
                  ${(client.balance || 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-0.5 mt-2">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Mail className="size-3" />
                <span className="text-[11px] truncate text-slate-600">{client.email || "No email provided"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Hash className="size-3" />
                <span className="text-[11px] text-slate-600">ABN: {client.abn || "None"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
