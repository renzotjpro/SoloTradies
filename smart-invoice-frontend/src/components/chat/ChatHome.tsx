import { HeaderGreeting } from "./HeaderGreeting";
import { PromptInput } from "./PromptInput";
import { ExamplePrompts } from "./ExamplePrompts";

type ChatHomeProps = {
    onSubmit: (prompt: string) => void;
};

export function ChatHome({ onSubmit }: ChatHomeProps) {
    return (
        <div className="flex flex-col items-center w-full min-h-screen bg-background">
            <div className="w-full max-w-3xl px-4 flex flex-col items-center">
                <HeaderGreeting />

                <div className="w-full mb-6">
                    <PromptInput onSubmit={onSubmit} />
                </div>

                <ExamplePrompts onSelect={onSubmit} />
            </div>
        </div>
    );
}
