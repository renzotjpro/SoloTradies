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
        "company": "Sunset Homes Pty Ltd",
        "phone": "0412 555 001",
        "address": "10 Beach Rd, Bondi",
        "state": "NSW",
        "notes": None,
        "role": None,
        "owner_id": TEST_OWNER_ID,
    },
    {
        "id": 2,
        "name": "Mike's Plumbing",
        "abn": "12 345 678 901",
        "email": "mike@mikesplumbing.com.au",
        "company": "Mike's Plumbing",
        "phone": "0412 555 002",
        "address": "5 George St, Brisbane",
        "state": "QLD",
        "notes": None,
        "role": None,
        "owner_id": TEST_OWNER_ID,
    },
    {
        "id": 3,
        "name": "Coastal Carpentry",
        "abn": "98 765 432 109",
        "email": "admin@coastalcarpentry.com.au",
        "company": "Coastal Carpentry",
        "phone": "0412 555 003",
        "address": "22 Ocean Blvd, Gold Coast",
        "state": "QLD",
        "notes": None,
        "role": None,
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
        "issue_date": "2026-02-15",
        "due_date": "2026-03-01",
        "notes": "Bathroom renovation",
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
        "issue_date": "2026-03-10",
        "due_date": "2026-03-25",
        "notes": "Pipe repair",
        "owner_id": TEST_OWNER_ID,
    },
    {
        "id": 102,
        "invoice_number": "INV-IJKL9012",
        "client_id": 1,
        "status": "Overdue",
        "subtotal": 5000.00,
        "tax_amount": 500.00,
        "total_amount": 5500.00,
        "issue_date": "2026-01-20",
        "due_date": "2026-02-03",
        "notes": "Kitchen remodel",
        "owner_id": TEST_OWNER_ID,
    },
    {
        "id": 103,
        "invoice_number": "INV-MNOP3456",
        "client_id": 3,
        "status": "Sent",
        "subtotal": 1200.00,
        "tax_amount": 120.00,
        "total_amount": 1320.00,
        "issue_date": "2026-03-01",
        "due_date": "2026-03-15",
        "notes": "Deck construction",
        "owner_id": TEST_OWNER_ID,
    },
]

FAKE_INVOICE_ITEMS = [
    {"id": 200, "invoice_id": 100, "description": "Labour - bathroom reno", "quantity": 16, "unit_price": 125.0, "amount": 2000.0, "tax_rate": 0.10},
    {"id": 201, "invoice_id": 101, "description": "Pipe repair", "quantity": 1, "unit_price": 800.0, "amount": 800.0, "tax_rate": 0.10},
    {"id": 202, "invoice_id": 102, "description": "Kitchen remodel labour", "quantity": 40, "unit_price": 125.0, "amount": 5000.0, "tax_rate": 0.10},
    {"id": 203, "invoice_id": 103, "description": "Deck construction", "quantity": 1, "unit_price": 1200.0, "amount": 1200.0, "tax_rate": 0.10},
]

FAKE_EXPENSES = [
    {
        "id": 300, "description": "Bunnings supplies", "amount": 150.00, "gst_included": 13.64,
        "category": "Materials", "expense_date": "2026-03-10", "receipt_url": "https://receipts/1.jpg",
        "client_id": 1, "invoice_id": 100, "owner_id": TEST_OWNER_ID,
    },
    {
        "id": 301, "description": "Petrol", "amount": 85.00, "gst_included": 7.73,
        "category": "Transport", "expense_date": "2026-03-15", "receipt_url": None,
        "client_id": None, "invoice_id": None, "owner_id": TEST_OWNER_ID,
    },
    {
        "id": 302, "description": "Tiles and adhesive", "amount": 920.00, "gst_included": 83.64,
        "category": "Materials", "expense_date": "2026-02-20", "receipt_url": "https://receipts/2.jpg",
        "client_id": 1, "invoice_id": 102, "owner_id": TEST_OWNER_ID,
    },
    {
        "id": 303, "description": "Plumbing fittings", "amount": 340.00, "gst_included": 30.91,
        "category": "Materials", "expense_date": "2026-01-25", "receipt_url": "https://receipts/3.jpg",
        "client_id": 2, "invoice_id": None, "owner_id": TEST_OWNER_ID,
    },
]

FAKE_ORGANIZATIONS = [
    {
        "id": 1, "owner_id": TEST_OWNER_ID, "name": "MJ Electrical Pty Ltd",
        "abn": "53 004 085 616", "industry": "Electrical", "phone": "0400 111 222",
        "email": "mj@mjelectrical.com.au", "country": "Australia", "state": "NSW",
        "city": "Sydney", "address_line1": "1 Spark St", "address_line2": None, "postcode": "2000",
    },
]

FAKE_BRANDING = [
    {
        "id": 1, "owner_id": TEST_OWNER_ID, "template_id": "tradie-classic",
        "header_layout": "full-bar", "colour_graphical": "#C0392B", "colour_text": "#333333",
        "font_family": "Inter", "font_size": "14px", "logo_url": "https://logos/mj.png",
        "logo_position": "left", "payment_terms": "14 days",
        "payment_details": "BSB: 123-456, Acc: 789012",
        "footer_message": "Thanks for choosing MJ Electrical!",
        "terms_conditions": "Payment due within 14 days.",
    },
]

FAKE_CUSTOM_LABELS = [
    {"id": 1, "owner_id": TEST_OWNER_ID, "label_key": "Invoice", "label_value": "Tax Invoice"},
    {"id": 2, "owner_id": TEST_OWNER_ID, "label_key": "Description", "label_value": "Work Performed"},
]

FAKE_CONVERSATIONS = [
    {
        "id": "conv-001", "owner_id": TEST_OWNER_ID, "title": "Brett Wilson invoice",
        "summary": "Working on bathroom renovation invoice for Brett",
        "is_archived": False, "updated_at": "2026-03-20T10:00:00Z",
    },
    {
        "id": "conv-002", "owner_id": TEST_OWNER_ID, "title": "Q1 expense review",
        "summary": "Reviewing expenses for BAS preparation",
        "is_archived": False, "updated_at": "2026-03-18T10:00:00Z",
    },
]

FAKE_MEMORIES = [
    {
        "id": "mem-001", "owner_id": TEST_OWNER_ID, "category": "client_pricing",
        "subject": "Sunset Homes", "key": "Bathroom renovation labour",
        "value": "$125.00/unit", "source": "agent", "confidence": 1.0,
    },
    {
        "id": "mem-002", "owner_id": TEST_OWNER_ID, "category": "preference",
        "subject": None, "key": "payment_terms",
        "value": "14 days", "source": "manual", "confidence": 1.0,
    },
]

FAKE_PROFILES = [
    {
        "id": TEST_OWNER_ID, "full_name": "Matt Johnson",
        "business_name": "MJ Electrical", "abn": "53 004 085 616",
        "role": "electrician",
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
    """Builder that simulates the Supabase chained query API."""

    def __init__(self, data: list[dict], table_name: str = ""):
        self._data = list(data)  # copy to avoid mutation
        self._table_name = table_name
        self._filters: list[tuple] = []
        self._insert_data: dict | None = None
        self._limit_n: int | None = None
        self._next_id: int = max((r.get("id", 0) for r in data if isinstance(r.get("id", 0), int)), default=0) + 1

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

    def gte(self, col: str, val: Any) -> FakeQueryBuilder:
        self._filters.append(("gte", col, val))
        return self

    def lte(self, col: str, val: Any) -> FakeQueryBuilder:
        self._filters.append(("lte", col, val))
        return self

    def in_(self, col: str, vals: list) -> FakeQueryBuilder:
        self._filters.append(("in_", col, vals))
        return self

    def is_(self, col: str, val: str) -> FakeQueryBuilder:
        self._filters.append(("is_", col, val))
        return self

    def or_(self, expr: str) -> FakeQueryBuilder:
        self._filters.append(("or_", None, expr))
        return self

    def order(self, col: str, **kwargs) -> FakeQueryBuilder:
        return self

    def limit(self, n: int) -> FakeQueryBuilder:
        self._limit_n = n
        return self

    def range(self, start: int, end: int) -> FakeQueryBuilder:
        return self

    def single(self) -> FakeQueryBuilder:
        return self

    def insert(self, data: dict | list[dict]) -> FakeQueryBuilder:
        if isinstance(data, list):
            self._insert_data = data[0] if data else {}
        else:
            self._insert_data = data
        return self

    def upsert(self, data: dict | list[dict], **kwargs) -> FakeQueryBuilder:
        if isinstance(data, list):
            self._insert_data = data[0] if data else {}
        else:
            self._insert_data = data
        return self

    def update(self, data: dict) -> FakeQueryBuilder:
        return self

    def delete(self) -> FakeQueryBuilder:
        return self

    def _apply_or_filter(self, records: list[dict], expr: str) -> list[dict]:
        """Parse and apply or_() expressions like 'state.ilike.%qld%,state.ilike.%queensland%'."""
        parts = expr.split(",")
        matched = set()
        for part in parts:
            segments = part.strip().split(".")
            if len(segments) >= 3:
                col = segments[0]
                op = segments[1]
                val = ".".join(segments[2:])
                for i, r in enumerate(records):
                    if op == "ilike":
                        needle = val.strip("%").lower()
                        if needle in str(r.get(col, "")).lower():
                            matched.add(i)
                    elif op == "eq":
                        if str(r.get(col, "")) == val:
                            matched.add(i)
        return [records[i] for i in sorted(matched)]

    def execute(self) -> FakeResult:
        # INSERT path
        if self._insert_data is not None:
            record = {**self._insert_data}
            if "id" not in record:
                record["id"] = self._next_id
            self._data.append(record)
            return FakeResult(data=[record])

        # SELECT path — apply filters
        result = list(self._data)
        for entry in self._filters:
            op = entry[0]
            if op == "ilike":
                _, col, val = entry
                val_lower = val.strip("%").lower()
                result = [r for r in result if val_lower in str(r.get(col, "")).lower()]
            elif op == "eq":
                _, col, val = entry
                result = [r for r in result if r.get(col) == val]
            elif op == "neq":
                _, col, val = entry
                result = [r for r in result if r.get(col) != val]
            elif op == "gte":
                _, col, val = entry
                result = [r for r in result if str(r.get(col, "")) >= str(val)]
            elif op == "lte":
                _, col, val = entry
                result = [r for r in result if str(r.get(col, "")) <= str(val)]
            elif op == "in_":
                _, col, vals = entry
                result = [r for r in result if r.get(col) in vals]
            elif op == "is_":
                _, col, val = entry
                if val == "null":
                    result = [r for r in result if r.get(col) is None]
            elif op == "or_":
                _, _, expr = entry
                result = self._apply_or_filter(result, expr)

        if self._limit_n is not None:
            result = result[:self._limit_n]

        return FakeResult(data=result)


class FakeSupabase:
    """Drop-in mock for the Supabase client used throughout the app."""

    def __init__(
        self,
        clients: list[dict] | None = None,
        invoices: list[dict] | None = None,
        expenses: list[dict] | None = None,
        organizations: list[dict] | None = None,
        branding: list[dict] | None = None,
        labels: list[dict] | None = None,
        conversations: list[dict] | None = None,
        memories: list[dict] | None = None,
        profiles: list[dict] | None = None,
    ):
        self._tables: dict[str, list[dict]] = {
            "clients": list(clients) if clients is not None else list(FAKE_CLIENTS),
            "invoices": list(invoices) if invoices is not None else list(FAKE_INVOICES),
            "invoice_items": list(FAKE_INVOICE_ITEMS),
            "expenses": list(expenses) if expenses is not None else list(FAKE_EXPENSES),
            "conversations": list(conversations) if conversations is not None else list(FAKE_CONVERSATIONS),
            "conversation_messages": [],
            "user_memories": list(memories) if memories is not None else list(FAKE_MEMORIES),
            "organizations": list(organizations) if organizations is not None else list(FAKE_ORGANIZATIONS),
            "invoice_branding_settings": list(branding) if branding is not None else list(FAKE_BRANDING),
            "invoice_custom_labels": list(labels) if labels is not None else list(FAKE_CUSTOM_LABELS),
            "profiles": list(profiles) if profiles is not None else list(FAKE_PROFILES),
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
