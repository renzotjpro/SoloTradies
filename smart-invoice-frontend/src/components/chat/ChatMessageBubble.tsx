"use client";

import { Bot, User, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { InvoiceDraftCard } from "./InvoiceDraftCard";
import type { ChatMessage } from "@/lib/types/chat";
import { cn } from "@/lib/utils";

type ChatMessageBubbleProps = {
    message: ChatMessage;
    onQuickReply?: (messageId: string, choice: string) => void;
};

export function ChatMessageBubble({ message, onQuickReply }: ChatMessageBubbleProps) {
    const isUser = message.role === "user";
    const hasInvoice = !!message.createdInvoiceId;

    return (
        <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
            {!isUser && (
                <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-md transition-all duration-500",
                    hasInvoice
                        ? "bg-gradient-to-br from-brand-500 to-emerald-600 shadow-brand-200 dark:shadow-brand-900/40 scale-110"
                        : "bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-200 dark:shadow-indigo-900/60"
                )}>
                    {hasInvoice ? (
                        <CheckCircle2 size={18} className="text-white animate-in zoom-in duration-300" />
                    ) : (
                        <Bot size={18} className="text-white" />
                    )}
                </div>
            )}

            <div className={cn("max-w-[72%]", isUser ? "bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-lg shadow-indigo-200/60 dark:shadow-indigo-900/50" : "")}>
                {isUser ? (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                ) : (
                    <div className="flex flex-col gap-3">
                        <div className={cn(
                            "backdrop-blur-sm border rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm text-gray-700 transition-all duration-500 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0",
                            hasInvoice
                                ? "bg-brand-50/30 border-transparent dark:bg-brand-900/10 dark:text-brand-50 prose-strong:text-brand-700 dark:prose-strong:text-brand-300"
                                : "bg-white/90 border-indigo-100/70 dark:bg-[oklch(0.24_0.02_265)] dark:backdrop-blur-none dark:border-[oklch(0.32_0.04_265)] dark:text-[oklch(0.88_0_0)] prose-strong:text-indigo-700 dark:prose-strong:text-indigo-300"
                        )}>
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                            {message.isStreaming && (
                                <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-0.5 align-text-bottom" />
                            )}
                        </div>

                        {/* Quick-reply chips — only shown when choices are present and not streaming */}
                        {message.choices && !message.isStreaming && onQuickReply && (
                            <div className="flex flex-wrap gap-2 pl-1">
                                {message.choices.map((choice) => (
                                    <button
                                        key={choice}
                                        onClick={() => onQuickReply(message.id, choice)}
                                        className="
                                            inline-flex items-center gap-1.5
                                            px-4 py-2 rounded-full text-sm font-medium
                                            border border-indigo-300 text-indigo-700 bg-indigo-50
                                            dark:border-indigo-700 dark:text-indigo-300 dark:bg-indigo-950/60
                                            hover:bg-gradient-to-r hover:from-indigo-600 hover:to-blue-500 hover:text-white hover:border-transparent
                                            active:scale-95
                                            transition-all duration-200 cursor-pointer
                                            shadow-sm hover:shadow-md hover:shadow-indigo-200 dark:shadow-indigo-900/30 dark:hover:shadow-indigo-900/50
                                        "
                                    >
                                        {choice}
                                    </button>
                                ))}
                            </div>
                        )}

                        {message.structuredData && (
                            <div className="animate-in slide-in-from-bottom-2 duration-500">
                                <InvoiceDraftCard data={message.structuredData} invoiceId={message.createdInvoiceId} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isUser && (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-gray-500 flex items-center justify-center shrink-0 mt-1 overflow-hidden border border-gray-200/80 shadow-sm dark:from-slate-600 dark:to-slate-700 dark:text-slate-300 dark:border-slate-500/50">
                    <User size={18} />
                </div>
            )}
        </div>
    );
}
