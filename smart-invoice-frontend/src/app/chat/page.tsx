"use client";

import { useState, useCallback } from "react";
import { ChatHome } from "@/components/chat/ChatHome";
import { ChatActive } from "@/components/chat/ChatActive";
import { useChat } from "@/lib/hooks/useChat";
import type { ChatView } from "@/lib/types/chat";

export default function ChatPage() {
    const [view, setView] = useState<ChatView>("home");
    const { messages, isGenerating, sendMessageStreaming, resetChat } = useChat();

    const handleFirstMessage = useCallback((prompt: string) => {
        setView("active");
        sendMessageStreaming(prompt);
    }, [sendMessageStreaming]);

    const handleNewChat = useCallback(() => {
        resetChat();
        setView("home");
    }, [resetChat]);

    if (view === "home") {
        return <ChatHome onSubmit={handleFirstMessage} />;
    }

    return (
        <ChatActive
            messages={messages}
            isGenerating={isGenerating}
            onSend={sendMessageStreaming}
        />
    );
}
