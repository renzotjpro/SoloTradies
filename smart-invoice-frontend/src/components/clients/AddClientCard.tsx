"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ClientCardVariant } from "./ClientCard";

interface AddClientCardProps {
  variant?: ClientCardVariant;
}

export function AddClientCard({ variant = "standard" }: AddClientCardProps) {
  const isCompactV1 = variant === "compact-v1";
  const isCompactV2 = variant === "compact-v2";
  const isCompact = isCompactV1 || isCompactV2;

  return (
    <Link href="/clients/new" className="hidden md:block">
      <Card className={`h-full border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300 group cursor-pointer bg-slate-50/50 ${isCompactV2 ? 'min-h-[200px]' : ''}`}>
        <CardContent className={`h-full flex flex-col items-center justify-center p-6 text-center ${!isCompact ? 'min-h-[300px]' : ''}`}>
          <div className={`${isCompact ? 'size-12 mb-3' : 'size-16 mb-6'} rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform duration-300`}>
            <Plus className={`${isCompact ? 'size-6' : 'size-8'} text-blue-600`} />
          </div>
          <h3 className={`${isCompact ? 'text-base' : 'text-lg'} font-bold text-slate-900 mb-2`}>Add New Client</h3>
          {!isCompactV2 && (
            <p className="text-sm text-slate-500 max-w-[200px]">
              Onboard a new company to your Invoize portal.
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
