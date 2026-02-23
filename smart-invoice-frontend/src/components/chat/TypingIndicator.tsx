import { Bot } from "lucide-react";

export function TypingIndicator() {
    return (
        <div className="flex justify-start gap-4">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0 shadow-sm">
                <Bot size={18} />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm text-gray-500 flex items-center gap-2">
                <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
        </div>
    );
}
