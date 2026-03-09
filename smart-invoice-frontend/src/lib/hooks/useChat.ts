"use client";

import { useState, useCallback } from "react";
import type { ChatMessage } from "@/lib/types/chat";
import { authFetch } from "@/lib/api/authFetch";
import { getConversation } from "@/lib/api/conversations";

export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);

    const loadConversation = useCallback(async (id: string) => {
        try {
            const { messages: loadedMessages } = await getConversation(id);
            setMessages(loadedMessages);
            setConversationId(id);
        } catch (error) {
            console.error("Failed to load conversation:", error);
        }
    }, []);

    const sendMessage = useCallback(async (content: string) => {
        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content,
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setIsGenerating(true);

        try {
            const response = await authFetch(`/api/chat/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                    conversation_id: conversationId,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch response from AI Agent");
            }

            const data = await response.json();

            // Track conversation ID from backend
            if (data.conversationId) {
                setConversationId(data.conversationId);
            }

            const aiMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: data.reply,
                choices: data.choices ?? undefined,
                structuredData: data.structuredData ?? undefined,
                createdInvoiceId: data.createdInvoiceId ?? undefined,
            };

            setMessages((prev) => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content:
                        "Sorry, I ran into an error connecting to the backend. Please ensure the FastAPI server is running.",
                },
            ]);
        } finally {
            setIsGenerating(false);
        }
    }, [messages, conversationId]);

    const sendMessageStreaming = useCallback(async (content: string) => {
        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content,
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setIsGenerating(true);

        const assistantId = crypto.randomUUID();
        setMessages((prev) => [
            ...prev,
            { id: assistantId, role: "assistant", content: "", isStreaming: true },
        ]);

        try {
            const response = await authFetch(`/api/chat/stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                    conversation_id: conversationId,
                }),
            });

            if (!response.ok || !response.body) {
                throw new Error("Streaming request failed");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    const payload = JSON.parse(line.slice(6));

                    if (payload.type === "token") {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantId
                                    ? { ...m, content: m.content + payload.content }
                                    : m
                            )
                        );
                    } else if (payload.type === "choices") {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantId
                                    ? { ...m, choices: payload.data }
                                    : m
                            )
                        );
                    } else if (payload.type === "structured_data") {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantId
                                    ? { ...m, structuredData: payload.data }
                                    : m
                            )
                        );
                    } else if (payload.type === "done") {
                        // Capture conversationId from backend
                        if (payload.conversationId) {
                            setConversationId(payload.conversationId);
                        }
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantId
                                    ? { ...m, isStreaming: false, createdInvoiceId: payload.createdInvoiceId ?? undefined }
                                    : m
                            )
                        );
                    }
                }
            }
        } catch (error) {
            console.error(error);
            // Fallback: try non-streaming
            setMessages((prev) => prev.filter((m) => m.id !== assistantId));
            setIsGenerating(false);
            setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
            await sendMessage(content);
            return;
        } finally {
            setIsGenerating(false);
        }
    }, [messages, conversationId, sendMessage]);

    /**
     * Called when the user taps a quick-reply chip.
     * Clears the choices from the originating message (so buttons disappear)
     * and sends the choice text as a new user message.
     */
    const onQuickReply = useCallback((messageId: string, choice: string) => {
        const text = choice.match(/^(\d+)\./)?.[1] ?? choice;
        setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, choices: undefined } : m))
        );
        sendMessageStreaming(text);
    }, [sendMessageStreaming]);

    const resetChat = useCallback(() => {
        setMessages([]);
        setIsGenerating(false);
        setConversationId(null);
    }, []);

    return {
        messages,
        isGenerating,
        conversationId,
        sendMessage,
        sendMessageStreaming,
        onQuickReply,
        resetChat,
        loadConversation,
    };
}
