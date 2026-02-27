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
  choices?: string[];      // quick-reply button labels, e.g. ["1. Create as new client", "2. Invoice only"]
  createdInvoiceId?: number; // set only after the invoice is saved to the DB
  isStreaming?: boolean;
};

export type ChatView = "home" | "active";
