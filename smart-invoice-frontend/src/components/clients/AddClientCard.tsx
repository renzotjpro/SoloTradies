"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";

export function AddClientCard() {
  return (
    <Link href="/clients/new">
      <Card className="h-full border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300 group cursor-pointer bg-slate-50/50">
        <CardContent className="h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center">
          <div className="size-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-6 border border-slate-100 group-hover:scale-110 transition-transform duration-300">
            <Plus className="size-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Add New Client</h3>
          <p className="text-sm text-slate-500 max-w-[200px]">
            Onboard a new company to your Invoize portal.
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
