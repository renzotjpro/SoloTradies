"use client";

import { useState } from "react";
import { Send, Bot, User, FileText, CheckCircle2 } from "lucide-react";

export default function CreateInvoicePage() {
    const [messages, setMessages] = useState<Array<{ role: string; content: string; structuredData?: Record<string, string> }>>([
        {
            role: "assistant",
            content: "Hello Jhon! I'm Invoize AI. Please describe the service you completed today. Include the client name, what you did, and how much to charge.",
        }
    ]);
    const [input, setInput] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        // Add user message to UI immediately
        const userMessage = { role: "user", content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setIsGenerating(true);

        try {
            // Send the entire conversation history to the backend agent
            const response = await fetch("http://localhost:8000/api/chat/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch response from AI Agent");
            }

            const data = await response.json();

            // Add AI response to UI
            const aiMessage = {
                role: "assistant",
                content: data.reply,
                structuredData: data.structuredData
            };

            setMessages((prev) => [...prev, aiMessage]);

        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, I ran into an error connecting to the backend. Please ensure the FastAPI server is running." }
            ]);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
                <p className="text-gray-500 mt-1">Chat with Invoize AI to instantly draft and generate an invoice.</p>
            </div>

            <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                    {messages.map((message, index) => (
                        <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} gap-4`}>

                            {message.role === "assistant" && (
                                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                    <Bot size={18} />
                                </div>
                            )}

                            <div className={`max-w-[70%] ${message.role === "user" ? "bg-brand-600 text-white rounded-2xl rounded-tr-none px-5 py-3 shadow-md shadow-brand-200" : ""}`}>
                                {message.role === "assistant" ? (
                                    <div className="flex flex-col gap-3">
                                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-3 shadow-sm text-gray-700">
                                            {message.content}
                                        </div>

                                        {/* Render structured data block if present */}
                                        {message.structuredData && (
                                            <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden w-80">
                                                <div className="bg-brand-50 px-4 py-3 border-b border-brand-100 flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-brand-600" />
                                                    <span className="font-semibold text-brand-900 text-sm">Invoice Details Draft</span>
                                                </div>
                                                <div className="p-4 space-y-3 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Client:</span>
                                                        <span className="font-medium text-gray-900">{message.structuredData.client}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Service:</span>
                                                        <span className="font-medium text-gray-900">{message.structuredData.service}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Amount:</span>
                                                        <span className="font-medium text-gray-900">{message.structuredData.amount}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Date:</span>
                                                        <span className="font-medium text-gray-900">{message.structuredData.date}</span>
                                                    </div>
                                                    <button className="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-xl flex justify-center items-center gap-2 transition-colors">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Generate PDF
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p>{message.content}</p>
                                )}
                            </div>

                            {message.role === "user" && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shrink-0 mt-1 overflow-hidden border border-gray-100">
                                    <User size={18} />
                                </div>
                            )}

                        </div>
                    ))}

                    {isGenerating && (
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
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="e.g. Deep cleaned 2 bedrooms for Marvin McKinney..."
                            className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-full pl-6 pr-14 py-4 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-gray-400 font-medium"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="absolute right-2 top-2 bottom-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm"
                        >
                            <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
                        </button>
                    </div>
                    <div className="text-center mt-3">
                        <p className="text-xs text-gray-400">Invoize AI can make mistakes. Verify invoice details before sending.</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
