import Link from "next/link";
import { Card } from "@/components/ui/card";

export function RecentChats() {
    const dummyChats = [
        { id: 1, title: "Methods for finding sine and cosine", time: "32 minutes ago", msgs: 2 },
        { id: 2, title: "Constructing a triangle", time: "1 day ago", msgs: 3 },
        { id: 3, title: "Main clause in the sentence about the airplane", time: "3 days ago", msgs: 12 },
        { id: 4, title: "Tips for organizing a study day and beyond...", time: "3 days ago", msgs: 4 },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto px-4 mt-16 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-foreground">Recent chats</h2>
                <Link href="/chats" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                    All chats
                </Link>
            </div>

            {/* Horizontal scrollable container hiding scrollbar */}
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {dummyChats.map((chat) => (
                    <Card
                        key={chat.id}
                        className="flex-shrink-0 w-64 p-4 rounded-xl cursor-pointer hover:bg-accent hover:border-accent-foreground/20 transition-colors snap-start flex flex-col justify-between min-h-[100px]"
                    >
                        <h3 className="text-sm font-medium leading-snug line-clamp-2 mb-4">
                            {chat.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                            <span>{chat.time}</span>
                            <span>{chat.msgs} messages</span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
