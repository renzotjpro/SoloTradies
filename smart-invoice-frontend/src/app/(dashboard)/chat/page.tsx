"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ChatHome } from "@/components/chat/ChatHome";
import { ChatActive } from "@/components/chat/ChatActive";
import { useChat } from "@/lib/hooks/useChat";
import type { ChatView } from "@/lib/types/chat";

export default function ChatPage() {
    const searchParams = useSearchParams();
    const [view, setView] = useState<ChatView>("home");
    const {
        messages,
        isGenerating,
        conversationId,
        sendMessageStreaming,
        onQuickReply,
        resetChat,
        loadConversation,
    } = useChat();

    // Resume conversation from URL param ?c=<conversationId>
    useEffect(() => {
        const cId = searchParams.get("c");
        if (cId && cId !== conversationId) {
            loadConversation(cId).then(() => setView("active"));
        }
    }, [searchParams, conversationId, loadConversation]);

    const handleFirstMessage = useCallback((prompt: string) => {
        setView("active");
        sendMessageStreaming(prompt);
    }, [sendMessageStreaming]);

    const handleNewChat = useCallback(() => {
        resetChat();
        setView("home");
        // Clean URL param if present
        if (searchParams.get("c")) {
            window.history.replaceState(null, "", "/chat");
        }
    }, [resetChat, searchParams]);

    const handleSelectConversation = useCallback((id: string) => {
        loadConversation(id).then(() => {
            setView("active");
            window.history.replaceState(null, "", `/chat?c=${id}`);
        });
    }, [loadConversation]);

    if (view === "home") {
        return (
            <ChatHome
                onSubmit={handleFirstMessage}
                onSelectConversation={handleSelectConversation}
            />
        );
    }

    return (
        <ChatActive
            messages={messages}
            isGenerating={isGenerating}
            onSend={sendMessageStreaming}
            onQuickReply={onQuickReply}
            onNewChat={handleNewChat}
            conversationId={conversationId}
        />
    );
}
