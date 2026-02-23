export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  structuredData?: {
    client?: string;
    service?: string;
    amount?: string;
    date?: string;
  };
  isStreaming?: boolean;
};

export type ChatView = "home" | "active";
