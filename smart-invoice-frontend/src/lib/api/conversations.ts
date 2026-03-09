import { authFetch } from "@/lib/api/authFetch";
import type { Conversation, ChatMessage } from "@/lib/types/chat";

export async function getConversations(
  limit = 20,
  offset = 0
): Promise<Conversation[]> {
  const res = await authFetch(
    `/api/conversations/?limit=${limit}&offset=${offset}`
  );
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
}

export async function getConversation(
  id: string
): Promise<{ conversation: Conversation; messages: ChatMessage[] }> {
  const res = await authFetch(`/api/conversations/${id}`);
  if (!res.ok) throw new Error("Conversation not found");
  const data = await res.json();
  // Map DB messages to frontend ChatMessage shape
  const messages: ChatMessage[] = (data.messages || []).map(
    (m: { id: string; role: string; content: string; metadata?: Record<string, unknown> }) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      choices: (m.metadata as Record<string, unknown>)?.choices as string[] | undefined,
      structuredData: (m.metadata as Record<string, unknown>)?.structuredData as ChatMessage["structuredData"],
      createdInvoiceId: (m.metadata as Record<string, unknown>)?.createdInvoiceId as number | undefined,
    })
  );
  return {
    conversation: {
      id: data.id,
      title: data.title,
      summary: data.summary,
      is_archived: data.is_archived,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
    messages,
  };
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await authFetch(`/api/conversations/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete conversation");
}

export async function archiveConversation(id: string): Promise<void> {
  const res = await authFetch(`/api/conversations/${id}/archive`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to archive conversation");
}
