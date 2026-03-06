"use client";

import { MessageList } from "./MessageList";
import { PromptInput } from "./PromptInput";
import type { ChatMessage } from "@/lib/types/chat";

type ChatActiveProps = {
    messages: ChatMessage[];
    isGenerating: boolean;
    onSend: (content: string) => void;
    onQuickReply?: (messageId: string, choice: string) => void;
};

export function ChatActive({ messages, isGenerating, onSend, onQuickReply }: ChatActiveProps) {
    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex-1 bg-gradient-to-b from-[#F0F4FF] via-[#F5F8FF] to-[#EEF3FF] dark:[background-image:none] dark:bg-[oklch(0.185_0.015_265)] rounded-3xl border border-indigo-100 dark:border-[oklch(0.30_0.04_265)] shadow-lg dark:shadow-indigo-950/40 flex flex-col overflow-hidden">
                <MessageList messages={messages} isGenerating={isGenerating} onQuickReply={onQuickReply} />
                <PromptInput onSubmit={onSend} disabled={isGenerating} variant="compact" />
            </div>
        </div>
    );
}
