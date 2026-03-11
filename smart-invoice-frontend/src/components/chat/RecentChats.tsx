"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getConversations } from "@/lib/api/conversations";
import type { Conversation } from "@/lib/types/chat";

import { X } from "lucide-react";
import { deleteConversation } from "@/lib/api/conversations";

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

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent card click
        try {
            await deleteConversation(id);
            setConversations((prev) => prev.filter((conv) => conv.id !== id));
        } catch (error) {
            console.error("Failed to delete conversation", error);
        }
    };

    if (loading || conversations.length === 0) return null;

    return (
        <div className="w-full mt-12 mb-8 text-left">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recent chats</h2>
                <button className="text-xs font-semibold text-brand-600 hover:underline">View All</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        className="group relative bg-background border border-border rounded-xl p-4 cursor-pointer hover:bg-accent/50 hover:shadow-sm transition-all flex items-center gap-3"
                    >
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />

                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-brand-600 transition-colors">
                                {conv.title || "Untitled chat"}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-medium mt-0.5">
                                <span>{relativeTime(conv.updated_at)}</span>
                                <span>•</span>
                                <span>Analysis</span>
                            </div>
                        </div>

                        <button
                            onClick={(e) => handleDelete(e, conv.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-brand-100 hover:text-brand-700 text-muted-foreground transition-all"
                            aria-label="Delete"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
