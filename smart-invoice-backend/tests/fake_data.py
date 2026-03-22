"""
Test data factories and mock infrastructure for SoloTradies agent tests.

Provides:
- FAKE_CLIENTS / FAKE_INVOICES — dummy tradie data
- FakeSupabase — drop-in mock for the Supabase chained query API
- FakeLLM — queue-based mock for deterministic LLM responses
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from langchain_core.messages import AIMessage


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

TEST_OWNER_ID = "test-owner-00000000-0000-0000-0000-000000000001"

FAKE_CLIENTS = [
    {
        "id": 1,
        "name": "Sunset Homes",
        "abn": "51 824 753 556",
        "email": "info@sunsethomes.com.au",
        "owner_id": TEST_OWNER_ID,
    },
    {
        "id": 2,
        "name": "Mike's Plumbing",
        "abn": "12 345 678 901",
        "email": "mike@mikesplumbing.com.au",
        "owner_id": TEST_OWNER_ID,
    },
    {
        "id": 3,
        "name": "Coastal Carpentry",
        "abn": "98 765 432 109",
        "email": "admin@coastalcarpentry.com.au",
        "owner_id": TEST_OWNER_ID,
    },
]

FAKE_INVOICES = [
    {
        "id": 100,
        "invoice_number": "INV-ABCD1234",
        "client_id": 1,
        "status": "Paid",
        "subtotal": 2000.00,
        "tax_amount": 200.00,
        "total_amount": 2200.00,
        "owner_id": TEST_OWNER_ID,
    },
    {
        "id": 101,
        "invoice_number": "INV-EFGH5678",
        "client_id": 2,
        "status": "Draft",
        "subtotal": 800.00,
        "tax_amount": 80.00,
        "total_amount": 880.00,
        "owner_id": TEST_OWNER_ID,
    },
]


# ---------------------------------------------------------------------------
# FakeSupabase — mimics the chained query API
# ---------------------------------------------------------------------------

@dataclass
class FakeResult:
    """Mimics the Supabase execute() result."""
    data: list[dict] = field(default_factory=list)


class FakeQueryBuilder:
    """Builder that simulates .select().ilike().eq().execute() chains."""

    def __init__(self, data: list[dict], table_name: str = ""):
        self._data = list(data)  # copy to avoid mutation
        self._table_name = table_name
        self._filters: list[tuple[str, str, Any]] = []
        self._insert_data: dict | None = None
        self._next_id: int = max((r.get("id", 0) for r in data), default=0) + 1

    def select(self, *cols: str) -> FakeQueryBuilder:
        return self

    def ilike(self, col: str, val: str) -> FakeQueryBuilder:
        self._filters.append(("ilike", col, val))
        return self

    def eq(self, col: str, val: Any) -> FakeQueryBuilder:
        self._filters.append(("eq", col, val))
        return self

    def neq(self, col: str, val: Any) -> FakeQueryBuilder:
        self._filters.append(("neq", col, val))
        return self

    def order(self, col: str, **kwargs) -> FakeQueryBuilder:
        return self

    def limit(self, n: int) -> FakeQueryBuilder:
        return self

    def insert(self, data: dict | list[dict]) -> FakeQueryBuilder:
        self._insert_data = data if isinstance(data, dict) else data[0]
        return self

    def upsert(self, data: dict | list[dict], **kwargs) -> FakeQueryBuilder:
        self._insert_data = data if isinstance(data, dict) else data[0]
        return self

    def update(self, data: dict) -> FakeQueryBuilder:
        return self

    def delete(self) -> FakeQueryBuilder:
        return self

    def execute(self) -> FakeResult:
        # INSERT path
        if self._insert_data is not None:
            record = {**self._insert_data, "id": self._next_id}
            self._data.append(record)
            return FakeResult(data=[record])

        # SELECT path — apply filters
        result = self._data
        for op, col, val in self._filters:
            if op == "ilike":
                val_lower = val.strip("%").lower()
                result = [r for r in result if val_lower in str(r.get(col, "")).lower()]
            elif op == "eq":
                result = [r for r in result if r.get(col) == val]
            elif op == "neq":
                result = [r for r in result if r.get(col) != val]
        return FakeResult(data=result)


class FakeSupabase:
    """Drop-in mock for the Supabase client used throughout the app."""

    def __init__(
        self,
        clients: list[dict] | None = None,
        invoices: list[dict] | None = None,
    ):
        self._tables: dict[str, list[dict]] = {
            "clients": list(clients) if clients is not None else list(FAKE_CLIENTS),
            "invoices": list(invoices) if invoices is not None else [],
            "invoice_items": [],
            "conversations": [],
            "conversation_messages": [],
            "user_memories": [],
            "organizations": [],
            "invoice_branding_settings": [],
            "invoice_custom_labels": [],
            "profiles": [],
        }

    def table(self, name: str) -> FakeQueryBuilder:
        data = self._tables.get(name, [])
        return FakeQueryBuilder(data, table_name=name)

    def rpc(self, fn_name: str, params: dict | None = None) -> FakeResult:
        """Mock RPC calls (e.g. match_memories). Returns empty by default."""
        return FakeResult(data=[])


# ---------------------------------------------------------------------------
# FakeLLM — deterministic mock for unit tests
# ---------------------------------------------------------------------------

class FakeStructuredLLM:
    """Returned by FakeLLM.with_structured_output(). Pops from a response queue."""

    def __init__(self, responses: list):
        self._responses = responses

    def invoke(self, messages: list, **kwargs) -> Any:
        if self._responses:
            return self._responses.pop(0)
        raise RuntimeError("FakeStructuredLLM: no more queued responses")


class FakeLLM:
    """
    Queue-based mock LLM for deterministic unit tests.

    Usage:
        llm = FakeLLM(
            responses=["Hello!"],
            structured_responses=[IntentClassification(intent="conversation")],
        )
    """

    def __init__(
        self,
        responses: list[str] | None = None,
        structured_responses: list[Any] | None = None,
    ):
        self._responses = list(responses or [])
        self._structured_responses = list(structured_responses or [])

    def invoke(self, messages: list, **kwargs) -> AIMessage:
        if self._responses:
            return AIMessage(content=self._responses.pop(0))
        raise RuntimeError("FakeLLM: no more queued responses")

    def with_structured_output(self, schema: type, **kwargs) -> FakeStructuredLLM:
        return FakeStructuredLLM(self._structured_responses)
