"use client";

import { MessageList } from "./MessageList";
import { PromptInput } from "./PromptInput";
import type { ChatMessage } from "@/lib/types/chat";

type ChatActiveProps = {
    messages: ChatMessage[];
    isGenerating: boolean;
    onSend: (content: string) => void;
};

export function ChatActive({ messages, isGenerating, onSend }: ChatActiveProps) {
    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                <MessageList messages={messages} isGenerating={isGenerating} />
                <PromptInput onSubmit={onSend} disabled={isGenerating} variant="compact" />
            </div>
        </div>
    );
}
