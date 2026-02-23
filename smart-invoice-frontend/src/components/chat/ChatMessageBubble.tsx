import { Bot, User } from "lucide-react";
import { InvoiceDraftCard } from "./InvoiceDraftCard";
import type { ChatMessage } from "@/lib/types/chat";

type ChatMessageBubbleProps = {
    message: ChatMessage;
};

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
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
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-3 shadow-sm text-gray-700">
                            {message.content}
                            {message.isStreaming && (
                                <span className="inline-block w-0.5 h-4 bg-brand-600 animate-pulse ml-0.5 align-text-bottom" />
                            )}
                        </div>

                        {message.structuredData && (
                            <InvoiceDraftCard data={message.structuredData} />
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
