"""
MemoryProvider — abstraction layer for memory retrieval and storage.

Currently uses ILIKE text search on structured user_memories table.
Future: swap internals to use pgvector semantic search (Supabase Vector)
without changing any calling code in the agent graph or API routers.

Upgrade path:
1. Enable pgvector extension in Supabase dashboard
2. Populate embedding column on user_memories rows
3. Add Supabase RPC function match_memories(query_embedding, match_count, owner_id)
4. Update retrieve_relevant() to generate embeddings and call the RPC
5. Update store() to generate embeddings on write
"""

from supabase import Client
from app.crud.crud import get_memories, search_memories, upsert_memory


class MemoryProvider:
    """Unified interface for AI agent memory operations.

    All memory access from graph.py and agent.py goes through this class.
    The underlying retrieval strategy (text search vs vector similarity)
    is an implementation detail hidden behind this interface.
    """

    def __init__(self, sb: Client, owner_id: str):
        self.sb = sb
        self.owner_id = owner_id

    def retrieve_relevant(self, query: str, limit: int = 10) -> list[dict]:
        """Retrieve memories relevant to a natural language query.

        Now: ILIKE text search on key/value/subject fields.
        Future: vector similarity search using embeddings.
        """
        results = search_memories(self.sb, self.owner_id, query)
        return results[:limit]

    def retrieve_all(self, category: str = None) -> list[dict]:
        """Retrieve all memories for the user, optionally filtered by category."""
        return get_memories(self.sb, self.owner_id, category=category)

    def store(self, category: str, key: str, value: str,
              subject: str = None, source: str = "agent") -> dict | None:
        """Store or update a memory fact.

        Uses upsert on (owner_id, category, subject, key) so repeated
        stores for the same fact update rather than duplicate.

        Future: also generates and stores embedding vector alongside text.
        """
        return upsert_memory(
            self.sb, self.owner_id, category, key, value,
            subject=subject, source=source
        )

    def get_context_block(self, query: str = None) -> str:
        """Build a formatted text block of memories for system prompt injection.

        If query is provided, retrieves contextually relevant memories.
        Otherwise returns all memories for the user.

        Returns empty string if no memories exist.
        """
        if query:
            memories = self.retrieve_relevant(query, limit=15)
        else:
            memories = self.retrieve_all()

        if not memories:
            return ""

        # Group memories by category
        preferences = []
        client_pricing = []
        behavioral = []

        for mem in memories:
            cat = mem.get("category", "")
            entry = _format_memory_entry(mem)
            if cat == "preference":
                preferences.append(entry)
            elif cat == "client_pricing":
                client_pricing.append(entry)
            elif cat == "behavioral":
                behavioral.append(entry)

        sections = []

        if preferences:
            sections.append("--- Your Known Information ---")
            sections.extend(preferences)

        if client_pricing:
            sections.append("\n--- Client-Specific Pricing ---")
            sections.extend(client_pricing)

        if behavioral:
            sections.append("\n--- Your Preferences ---")
            sections.extend(behavioral)

        return "\n".join(sections)


def _format_memory_entry(mem: dict) -> str:
    """Format a single memory row into a readable line."""
    subject = mem.get("subject")
    key = mem.get("key", "")
    value = mem.get("value", "")
    if subject:
        return f"{subject}: {key} = {value}"
    return f"{key}: {value}"
