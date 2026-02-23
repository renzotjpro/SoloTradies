"use client";

import { useState, useRef } from "react";
import { Sparkles, ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type PromptInputProps = {
    onSubmit: (prompt: string) => void;
    disabled?: boolean;
    variant?: "home" | "compact";
};

export function PromptInput({ onSubmit, disabled, variant = "home" }: PromptInputProps) {
    const [prompt, setPrompt] = useState("");
    const [isImproving, setIsImproving] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const maxChars = 10000;

    const handleImprovePrompt = async () => {
        if (!prompt.trim() || disabled || isImproving) return;
        setIsImproving(true);
        try {
            const response = await fetch("http://localhost:8000/api/chat/improve-prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: prompt.trim() }),
            });
            if (!response.ok) throw new Error("Failed to improve prompt");
            const data = await response.json();
            setPrompt(data.improved_prompt);
        } catch (error) {
            console.error("Improve prompt failed:", error);
        } finally {
            setIsImproving(false);
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    };

    const handleSubmit = () => {
        if (!prompt.trim() || disabled) return;
        onSubmit(prompt.trim());
        setPrompt("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    if (variant === "compact") {
        return (
            <div className="p-4 bg-background border-t">
                <div className="relative flex items-center max-w-4xl mx-auto">
                    <textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full min-h-[48px] max-h-[120px] resize-none bg-muted/50 border rounded-2xl pl-4 pr-14 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-pink-400/50 focus:border-pink-400/50 transition-all"
                        maxLength={maxChars}
                        disabled={disabled}
                    />
                    <Button
                        size="icon"
                        onClick={handleSubmit}
                        disabled={!prompt.trim() || disabled}
                        className="absolute right-2 h-8 w-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    >
                        <ArrowUp className="h-4 w-4" />
                        <span className="sr-only">Submit</span>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4">
            <div className="relative group">
                {/* Glow effect behind the input */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>

                {/* Input Container */}
                <div className="relative flex flex-col bg-background border rounded-2xl shadow-sm transition-all overflow-hidden focus-within:ring-1 focus-within:ring-pink-400/50 focus-within:border-pink-400/50">
                    <textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Give me AGS a Task..............."
                        className="w-full min-h-[100px] resize-none bg-transparent px-4 pt-4 pb-2 text-foreground placeholder-muted-foreground focus:outline-none text-lg"
                        maxLength={maxChars}
                        disabled={disabled}
                    />

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between px-4 pb-3 pt-2 text-sm text-muted-foreground">
                        <button
                            type="button"
                            onClick={handleImprovePrompt}
                            disabled={isImproving || !prompt.trim()}
                            className="flex items-center gap-1.5 hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isImproving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            <span>{isImproving ? "Improving..." : "Improve Prompt"}</span>
                        </button>

                        <div className="flex items-center gap-4">
                            <span className="font-mono text-xs">
                                {prompt.length}/{maxChars}
                            </span>
                            <Button
                                size="icon"
                                onClick={handleSubmit}
                                disabled={!prompt.trim() || disabled}
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
