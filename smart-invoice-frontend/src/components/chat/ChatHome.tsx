import { HeaderGreeting } from "./HeaderGreeting";
import { PromptInput } from "./PromptInput";
import { ExamplePrompts } from "./ExamplePrompts";
import { RecentChats } from "./RecentChats";

type ChatHomeProps = {
    onSubmit: (prompt: string) => void;
    onSelectConversation: (conversationId: string) => void;
};

export function ChatHome({ onSubmit, onSelectConversation }: ChatHomeProps) {
    return (
        <div className="flex flex-col items-center w-full min-h-screen bg-background">
            <div className="w-full max-w-3xl px-4 flex flex-col items-center">
                <HeaderGreeting />

                <div className="w-full mb-6">
                    <PromptInput onSubmit={onSubmit} />
                </div>

                <ExamplePrompts onSelect={onSubmit} />
            </div>

            <RecentChats onSelect={onSelectConversation} />
        </div>
    );
}
