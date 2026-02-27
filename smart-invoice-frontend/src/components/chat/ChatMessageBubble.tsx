"use client";

import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { InvoiceDraftCard } from "./InvoiceDraftCard";
import type { ChatMessage } from "@/lib/types/chat";

type ChatMessageBubbleProps = {
    message: ChatMessage;
    onQuickReply?: (messageId: string, choice: string) => void;
};

export function ChatMessageBubble({ message, onQuickReply }: ChatMessageBubbleProps) {
    const isUser = message.role === "user";

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-4`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Bot size={18} />
                </div>
            )}

            <div className={`max-w-[70%] ${isUser ? "bg-brand-600 text-white rounded-2xl rounded-tr-none px-5 py-3 shadow-md shadow-brand-200" : ""}`}>
                {isUser ? (
                    <p>{message.content}</p>
                ) : (
                    <div className="flex flex-col gap-3">
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-3 shadow-sm text-gray-700 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                            {message.isStreaming && (
                                <span className="inline-block w-0.5 h-4 bg-brand-600 animate-pulse ml-0.5 align-text-bottom" />
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
                                            border border-brand-300 text-brand-700 bg-brand-50
                                            hover:bg-brand-600 hover:text-white hover:border-brand-600
                                            active:scale-95
                                            transition-all duration-150 cursor-pointer
                                            shadow-sm
                                        "
                                    >
                                        {choice}
                                    </button>
                                ))}
                            </div>
                        )}

                        {message.structuredData && (
                            <InvoiceDraftCard data={message.structuredData} invoiceId={message.createdInvoiceId} />
                        )}
                    </div>
                )}
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shrink-0 mt-1 overflow-hidden border border-gray-100">
                    <User size={18} />
                </div>
            )}
        </div>
    );
}
