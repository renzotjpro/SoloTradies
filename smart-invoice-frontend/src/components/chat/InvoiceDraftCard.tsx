"use client";

import Link from "next/link";
import { FileText, ExternalLink, Copy, Share2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InvoiceDraftCardProps = {
    data: {
        client?: string;
        service?: string;
        amount?: string;
        date?: string;
    };
    invoiceId?: number;
};

export function InvoiceDraftCard({ data, invoiceId }: InvoiceDraftCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        const url = `${window.location.origin}/invoices/${invoiceId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/invoices/${invoiceId}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Invoice for ${data.client}`,
                    text: `Here is the invoice for ${data.service}`,
                    url: url,
                });
            } catch (err) {
                console.error("Error sharing:", err);
            }
        } else {
            handleCopyLink();
        }
    };

    const isFinal = !!invoiceId;

    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-2xl border transition-all duration-300 w-80 shadow-sm hover:shadow-md",
                isFinal
                    ? "bg-gradient-to-br from-white to-brand-50/30 border-brand-200 dark:from-slate-900 dark:to-brand-950/20 dark:border-brand-900/50"
                    : "bg-white border-indigo-100 dark:bg-slate-900 dark:border-slate-800"
            )}
        >
            {/* Header */}
            <div className={cn(
                "px-4 py-3 flex items-center justify-between border-b transition-colors",
                isFinal
                    ? "bg-brand-50/50 border-brand-100 dark:bg-brand-950/40 dark:border-brand-900/40"
                    : "bg-slate-50/50 border-slate-100 dark:bg-slate-800/40 dark:border-slate-800"
            )}>
                <div className="flex items-center gap-2">
                    {isFinal ? (
                        <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    ) : (
                        <FileText className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    )}
                    <span className={cn(
                        "font-semibold text-xs uppercase tracking-wider",
                        isFinal ? "text-brand-900 dark:text-brand-300" : "text-slate-600 dark:text-slate-400"
                    )}>
                        {isFinal ? "Invoice Created" : "Draft Details"}
                    </span>
                </div>
                {isFinal && (
                    <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3 text-sm">
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Client</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{data.client || "—"}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Service</span>
                        <span className="text-right text-slate-700 dark:text-slate-300 max-w-[180px] truncate">{data.service || "—"}</span>
                    </div>
                    <div className="pt-2 flex justify-between items-center border-t border-slate-50 dark:border-slate-800/50">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Amount</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">{data.amount || "$0.00"}</span>
                    </div>
                </div>

                {/* Actions */}
                {isFinal ? (
                    <div className="pt-3 space-y-2">
                        <Button
                            asChild
                            className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm shadow-brand-200 dark:shadow-none transition-all active:scale-[0.98]"
                        >
                            <Link href={`/invoices/${invoiceId}`}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Invoice
                            </Link>
                        </Button>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyLink}
                                className="flex-1 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                {copied ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-brand-600" />
                                ) : (
                                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                                )}
                                {copied ? "Copied" : "Copy"}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleShare}
                                className="flex-1 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                                Share
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="pt-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 italic">
                            <span>* Pending confirmation</span>
                            <span>{data.date}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Subtle bottom accent for final card */}
            {isFinal && (
                <div className="h-1 w-full bg-gradient-to-r from-brand-400 to-indigo-500" />
            )}
        </div>
    );
}
