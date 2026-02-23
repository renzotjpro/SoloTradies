import { HeaderGreeting } from "./HeaderGreeting";
import { PromptInput } from "./PromptInput";
import { RecentChats } from "./RecentChats";

export function ChatHome() {
    return (
        <div className="flex flex-col w-full min-h-screen bg-background">
            <main className="flex-1 flex flex-col justify-start pt-[10vh]">
                <HeaderGreeting />

                <div className="mt-8 mb-4">
                    <PromptInput />
                </div>

                <div className="mt-auto">
                    <RecentChats />
                </div>
            </main>
        </div>
    );
}
