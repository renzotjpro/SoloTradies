"use client";

import { useState, useCallback } from "react";
import type { ChatMessage } from "@/lib/types/chat";

const API_BASE = "http://localhost:8000/api/chat";

export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

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
            const response = await fetch(`${API_BASE}/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch response from AI Agent");
            }

            const data = await response.json();

            const aiMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: data.reply,
                structuredData: data.structuredData ?? undefined,
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
    }, [messages]);

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
            const response = await fetch(`${API_BASE}/stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
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
                    } else if (payload.type === "structured_data") {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantId
                                    ? { ...m, structuredData: payload.data }
                                    : m
                            )
                        );
                    } else if (payload.type === "done") {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantId
                                    ? { ...m, isStreaming: false }
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
            // Remove the user message we already added, then use non-streaming
            setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
            await sendMessage(content);
            return;
        } finally {
            setIsGenerating(false);
        }
    }, [messages, sendMessage]);

    const resetChat = useCallback(() => {
        setMessages([]);
        setIsGenerating(false);
    }, []);

    return { messages, isGenerating, sendMessage, sendMessageStreaming, resetChat };
}
