"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PromptInput() {
    const [prompt, setPrompt] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const maxChars = 10000;

    // Auto-resize textarea
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4">
            <div className="relative group">
                {/* Glow effect behind the input - pink/magenta shadow as per design */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>

                {/* Input Container */}
                <div className="relative flex flex-col bg-background border rounded-2xl shadow-sm transition-all overflow-hidden focus-within:ring-1 focus-within:ring-pink-400/50 focus-within:border-pink-400/50">
                    <textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={handleInput}
                        placeholder="Give me AGS a Task..............."
                        className="w-full min-h-[100px] resize-none bg-transparent px-4 pt-4 pb-2 text-foreground placeholder-muted-foreground focus:outline-none text-lg"
                        maxLength={maxChars}
                    />

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between px-4 pb-3 pt-2 text-sm text-muted-foreground">
                        <button
                            type="button"
                            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>Improve Prompt</span>
                        </button>

                        <div className="flex items-center gap-4">
                            <span className="font-mono text-xs">
                                {prompt.length}/{maxChars}
                            </span>
                            <Button
                                size="icon"
                                className="h-8 w-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                            >
                                <ArrowUp className="h-4 w-4" />
                                <span className="sr-only">Submit</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
