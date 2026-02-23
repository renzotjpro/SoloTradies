"use client";

import { useRef, useEffect } from "react";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import type { ChatMessage } from "@/lib/types/chat";

type MessageListProps = {
    messages: ChatMessage[];
    isGenerating: boolean;
};

export function MessageList({ messages, isGenerating }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isGenerating]);

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
            {messages.map((message) => (
                <ChatMessageBubble key={message.id} message={message} />
            ))}

            {isGenerating && <TypingIndicator />}

            <div ref={bottomRef} />
        </div>
    );
}
