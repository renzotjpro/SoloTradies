"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getConversations } from "@/lib/api/conversations";
import type { Conversation } from "@/lib/types/chat";

type RecentChatsProps = {
    onSelect: (conversationId: string) => void;
};

function relativeTime(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "1 day ago";
    if (days < 30) return `${days} days ago`;
    return new Date(dateStr).toLocaleDateString();
}

export function RecentChats({ onSelect }: RecentChatsProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getConversations(8)
            .then(setConversations)
            .catch(() => setConversations([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading || conversations.length === 0) return null;

    return (
        <div className="w-full max-w-4xl mx-auto px-4 mt-16 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-foreground">Recent chats</h2>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {conversations.map((conv) => (
                    <Card
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        className="flex-shrink-0 w-64 p-4 rounded-xl cursor-pointer hover:bg-accent hover:border-accent-foreground/20 transition-colors snap-start flex flex-col justify-between min-h-[100px]"
                    >
                        <h3 className="text-sm font-medium leading-snug line-clamp-2 mb-4">
                            {conv.title || "Untitled chat"}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                            <span>{relativeTime(conv.updated_at)}</span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
