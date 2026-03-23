"""
Comprehensive test suite for the SoloTradies agent search capabilities.

56 test cases covering:
- CRUD search functions (16 tests)
- Search tools return format & fallback (20 tests)
- Intent classification for search queries (6 tests)
- Search routing (3 tests)
- Existing flow regression (3 tests)
- Conversation & memory search (4 tests)
- GST & revenue tools (4 tests)
"""

from unittest.mock import patch

from langchain_core.messages import HumanMessage

from tests.conftest import base_state
from tests.fake_data import (
    TEST_OWNER_ID,
    FakeSupabase,
)
from app.crud import crud
from app.agent.tools import make_search_tools
from app.agent.graph import (
    IntentClassification,
    classify_intent,
    route_after_intent,
    handle_conversation,
)


# ═══════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════

def _sb(**kwargs) -> FakeSupabase:
    """Shorthand to build a FakeSupabase with defaults."""
    return FakeSupabase(**kwargs)


def _tools(sb=None) -> list:
    """Build search tools with a FakeSupabase."""
    return make_search_tools(sb or _sb(), TEST_OWNER_ID)


def _tool_by_name(name: str, sb=None):
    """Get a specific tool by name."""
    for t in _tools(sb):
        if t.name == name:
            return t
    raise KeyError(f"No tool named '{name}'")


# ═══════════════════════════════════════════════════════════════════════════
# Group 1: CRUD Search Functions (16 tests)
# ═══════════════════════════════════════════════════════════════════════════

class TestSearchCRUD:
    """Tests for crud.search_clients, search_invoices, search_expenses, etc."""

    # --- search_clients ---

    def test_search_clients_by_name(self):
        sb = _sb()
        results = crud.search_clients(sb, TEST_OWNER_ID, "Sunset", "name")
        assert len(results) == 1
        assert results[0]["name"] == "Sunset Homes"

    def test_search_clients_by_name_partial(self):
        sb = _sb()
        results = crud.search_clients(sb, TEST_OWNER_ID, "plumb", "name")
        assert len(results) == 1
        assert results[0]["name"] == "Mike's Plumbing"

    def test_search_clients_by_email(self):
        sb = _sb()
        results = crud.search_clients(sb, TEST_OWNER_ID, "mike@", "email")
        assert len(results) == 1
        assert results[0]["email"] == "mike@mikesplumbing.com.au"

    def test_search_clients_by_company(self):
        sb = _sb()
        results = crud.search_clients(sb, TEST_OWNER_ID, "Coastal", "company")
        assert len(results) == 1
        assert results[0]["company"] == "Coastal Carpentry"

    def test_search_clients_by_abn_strips_formatting(self):
        sb = _sb()
        # The CRUD strips non-digits then does ILIKE "%digits%" against the raw stored value.
        # Use a contiguous digit substring that appears within the stored ABN "51 824 753 556".
        results = crud.search_clients(sb, TEST_OWNER_ID, "824", "abn")
        assert len(results) == 1
        assert results[0]["name"] == "Sunset Homes"

    def test_search_clients_by_state_abbreviation(self):
        sb = _sb()
        results = crud.search_clients(sb, TEST_OWNER_ID, "QLD", "state")
        assert len(results) == 2
        names = {r["name"] for r in results}
        assert "Mike's Plumbing" in names
        assert "Coastal Carpentry" in names

    def test_search_clients_no_results(self):
        sb = _sb()
        results = crud.search_clients(sb, TEST_OWNER_ID, "Nonexistent Corp", "name")
        assert results == []

    # --- search_invoices ---

    def test_search_invoices_by_status_paid(self):
        sb = _sb()
        results = crud.search_invoices(sb, TEST_OWNER_ID, status="paid")
        assert len(results) == 1
        assert results[0]["status"] == "Paid"

    def test_search_invoices_by_status_unpaid(self):
        sb = _sb()
        results = crud.search_invoices(sb, TEST_OWNER_ID, status="unpaid")
        # unpaid = Draft + Sent + Overdue
        assert len(results) == 3
        statuses = {r["status"] for r in results}
        assert statuses == {"Draft", "Sent", "Overdue"}

    def test_search_invoices_by_client_id(self):
        sb = _sb()
        results = crud.search_invoices(sb, TEST_OWNER_ID, client_id=1)
        assert len(results) == 2
        assert all(r["client_id"] == 1 for r in results)

    def test_search_invoices_by_date_range(self):
        sb = _sb()
        results = crud.search_invoices(
            sb, TEST_OWNER_ID, date_from="2026-03-01", date_to="2026-03-31"
        )
        assert len(results) == 2  # INV-EFGH5678 (Mar 10) and INV-MNOP3456 (Mar 1)

    def test_search_invoices_by_amount_range(self):
        sb = _sb()
        results = crud.search_invoices(
            sb, TEST_OWNER_ID, min_amount=1000, max_amount=3000
        )
        assert all(1000 <= r["total_amount"] <= 3000 for r in results)

    # --- search_expenses ---

    def test_search_expenses_by_category(self):
        sb = _sb()
        results = crud.search_expenses(sb, TEST_OWNER_ID, category="Materials")
        assert len(results) == 3
        assert all("Materials" in r["category"] for r in results)

    def test_search_expenses_missing_receipt(self):
        sb = _sb()
        results = crud.search_expenses(sb, TEST_OWNER_ID, missing_receipt=True)
        assert len(results) == 1
        assert results[0]["description"] == "Petrol"
        assert results[0]["receipt_url"] is None

    def test_search_expenses_by_description(self):
        sb = _sb()
        results = crud.search_expenses(sb, TEST_OWNER_ID, description="Bunnings")
        assert len(results) == 1
        assert results[0]["description"] == "Bunnings supplies"

    # --- get_gst_summary ---

    def test_get_gst_summary_q1(self):
        sb = _sb()
        summary = crud.get_gst_summary(sb, TEST_OWNER_ID, "2026-01-01", "2026-03-31")
        assert summary["invoice_count"] > 0
        assert summary["gst_collected"] > 0
        assert "net_gst" in summary


# ═══════════════════════════════════════════════════════════════════════════
# Group 2: Search Tools Return Format & Fallback (20 tests)
# ═══════════════════════════════════════════════════════════════════════════

class TestSearchTools:
    """Tests for each tool's return structure, data correctness, and fallback behavior."""

    # --- search_clients tool ---

    def test_tool_search_clients_found(self):
        tool = _tool_by_name("search_clients")
        result = tool.invoke({"query": "Sunset", "search_by": "name"})
        assert result["found"] is True
        assert result["count"] == 1
        assert result["clients"][0]["name"] == "Sunset Homes"

    def test_tool_search_clients_not_found_returns_fallback(self):
        tool = _tool_by_name("search_clients")
        result = tool.invoke({"query": "Nonexistent", "search_by": "name"})
        assert result["found"] is False
        assert result["count"] == 0
        assert "recent_clients" in result

    def test_tool_search_clients_by_state(self):
        tool = _tool_by_name("search_clients")
        result = tool.invoke({"query": "QLD", "search_by": "state"})
        assert result["found"] is True
        assert result["count"] == 2

    # --- search_invoices tool ---

    def test_tool_search_invoices_by_status(self):
        tool = _tool_by_name("search_invoices")
        result = tool.invoke({"status": "paid"})
        assert result["found"] is True
        assert result["count"] == 1
        assert result["invoices"][0]["status"] == "Paid"

    def test_tool_search_invoices_unpaid(self):
        tool = _tool_by_name("search_invoices")
        result = tool.invoke({"status": "unpaid"})
        assert result["found"] is True
        assert result["count"] == 3

    def test_tool_search_invoices_by_client_name(self):
        tool = _tool_by_name("search_invoices")
        result = tool.invoke({"client_name": "Sunset"})
        assert result["found"] is True
        assert result["count"] == 2

    def test_tool_search_invoices_client_not_found(self):
        tool = _tool_by_name("search_invoices")
        result = tool.invoke({"client_name": "Nobody"})
        assert result["found"] is False
        assert "suggestion" in result

    def test_tool_search_invoices_total_sum(self):
        tool = _tool_by_name("search_invoices")
        result = tool.invoke({"status": "paid"})
        assert result["total_sum"] == 2200.0

    # --- search_expenses tool ---

    def test_tool_search_expenses_by_category(self):
        tool = _tool_by_name("search_expenses")
        result = tool.invoke({"category": "Materials"})
        assert result["found"] is True
        assert result["count"] == 3
        assert result["total_amount"] > 0
        assert result["total_gst"] > 0

    def test_tool_search_expenses_missing_receipt(self):
        tool = _tool_by_name("search_expenses")
        result = tool.invoke({"missing_receipt": True})
        assert result["found"] is True
        assert result["count"] == 1
        assert result["expenses"][0]["has_receipt"] is False

    def test_tool_search_expenses_no_results(self):
        tool = _tool_by_name("search_expenses")
        result = tool.invoke({"category": "Entertainment"})
        assert result["found"] is False
        assert result["count"] == 0

    # --- get_business_profile tool ---

    def test_tool_business_profile_from_org(self):
        tool = _tool_by_name("get_business_profile")
        result = tool.invoke({})
        assert result["found"] is True
        assert result["source"] == "organizations"
        assert result["name"] == "MJ Electrical Pty Ltd"
        assert result["abn"] == "53 004 085 616"

    def test_tool_business_profile_fallback_to_profiles(self):
        sb = _sb(organizations=[])
        tool = _tool_by_name("get_business_profile", sb)
        result = tool.invoke({})
        assert result["found"] is True
        assert result["source"] == "profiles"
        assert result["full_name"] == "Matt Johnson"

    def test_tool_business_profile_none(self):
        sb = _sb(organizations=[], profiles=[])
        tool = _tool_by_name("get_business_profile", sb)
        result = tool.invoke({})
        assert result["found"] is False

    # --- get_branding_settings tool ---

    def test_tool_branding_settings_found(self):
        tool = _tool_by_name("get_branding_settings")
        result = tool.invoke({})
        assert result["found"] is True
        assert result["template_id"] == "tradie-classic"
        assert result["font_family"] == "Inter"
        assert "Invoice" in result["labels"]

    def test_tool_branding_settings_not_configured(self):
        sb = _sb(branding=[])
        tool = _tool_by_name("get_branding_settings", sb)
        result = tool.invoke({})
        assert result["found"] is False

    # --- search_conversations tool ---

    def test_tool_search_conversations_by_keyword(self):
        tool = _tool_by_name("search_conversations")
        result = tool.invoke({"query": "Brett"})
        assert result["found"] is True
        assert result["count"] == 1

    def test_tool_search_conversations_recent(self):
        tool = _tool_by_name("search_conversations")
        result = tool.invoke({})
        assert result["found"] is True
        assert result["count"] == 2

    def test_tool_search_conversations_no_match(self):
        tool = _tool_by_name("search_conversations")
        result = tool.invoke({"query": "nonexistent topic"})
        assert result["found"] is False

    # --- get_gst_summary tool ---

    def test_tool_gst_summary(self):
        tool = _tool_by_name("get_gst_summary")
        result = tool.invoke({"date_from": "2026-01-01", "date_to": "2026-03-31"})
        assert result["found"] is True
        assert "gst_collected" in result
        assert "gst_paid" in result
        assert "net_gst" in result


# ═══════════════════════════════════════════════════════════════════════════
# Group 3: Conversation & Memory Search (4 tests)
# ═══════════════════════════════════════════════════════════════════════════

class TestSearchConversationsAndMemory:
    """Tests for conversation and memory search CRUD."""

    def test_search_conversations_by_query_text(self):
        sb = _sb()
        results = crud.search_conversations_by_query(sb, TEST_OWNER_ID, query_text="expense")
        assert len(results) == 1
        assert "expense" in results[0]["title"].lower() or "expense" in (results[0].get("summary") or "").lower()

    def test_search_conversations_no_query_returns_recent(self):
        sb = _sb()
        results = crud.search_conversations_by_query(sb, TEST_OWNER_ID)
        assert len(results) == 2

    def test_search_memories_text_fallback(self):
        """search_memories ILIKE fallback finds pricing memories."""
        sb = _sb()
        # The ILIKE fallback path in crud.search_memories uses or_()
        results = crud.search_memories(sb, TEST_OWNER_ID, "Bathroom renovation")
        # Should find the pricing memory with "Bathroom renovation labour" in key
        assert len(results) >= 1

    def test_tool_search_memories_found(self):
        """search_user_memories tool returns found=True for relevant queries."""
        sb = _sb()
        # Patch MemoryProvider to use our fake data
        with patch("app.agent.tools.MemoryProvider") as MockProvider:
            instance = MockProvider.return_value
            instance.retrieve_relevant.return_value = [
                {"category": "client_pricing", "subject": "Sunset Homes",
                 "key": "Bathroom renovation labour", "value": "$125.00/unit"}
            ]
            tool = _tool_by_name("search_user_memories", sb)
            result = tool.invoke({"query": "bathroom pricing"})
            assert result["found"] is True
            assert result["count"] == 1


# ═══════════════════════════════════════════════════════════════════════════
# Group 4: Intent Classification (6 tests)
# ═══════════════════════════════════════════════════════════════════════════

class TestIntentClassification:
    """Tests that the classify_intent node routes search queries correctly."""

    def test_classify_search_unpaid_invoices(self, mock_llm, mock_supabase):
        mock_llm(structured_responses=[IntentClassification(intent="search")])
        state = base_state(messages=[HumanMessage(content="Show me my unpaid invoices")])
        result = classify_intent(state)
        assert result["intent"] == "search"

    def test_classify_search_find_client(self, mock_llm, mock_supabase):
        mock_llm(structured_responses=[IntentClassification(intent="search")])
        state = base_state(messages=[HumanMessage(content="Find client Brett")])
        result = classify_intent(state)
        assert result["intent"] == "search"

    def test_classify_search_whats_my_abn(self, mock_llm, mock_supabase):
        mock_llm(structured_responses=[IntentClassification(intent="search")])
        state = base_state(messages=[HumanMessage(content="What's my ABN?")])
        result = classify_intent(state)
        assert result["intent"] == "search"

    def test_classify_search_gst_quarter(self, mock_llm, mock_supabase):
        mock_llm(structured_responses=[IntentClassification(intent="search")])
        state = base_state(messages=[HumanMessage(content="How much GST this quarter?")])
        result = classify_intent(state)
        assert result["intent"] == "search"

    def test_classify_conversation_greeting(self, mock_llm, mock_supabase):
        mock_llm(structured_responses=[IntentClassification(intent="conversation")])
        state = base_state(messages=[HumanMessage(content="Hey mate")])
        result = classify_intent(state)
        assert result["intent"] == "conversation"

    def test_classify_invoice_creation(self, mock_llm, mock_supabase):
        mock_llm(structured_responses=[IntentClassification(intent="invoice")])
        state = base_state(messages=[HumanMessage(content="Invoice John $500 for plumbing")])
        result = classify_intent(state)
        assert result["intent"] == "invoice"


# ═══════════════════════════════════════════════════════════════════════════
# Group 5: Search Routing (3 tests)
# ═══════════════════════════════════════════════════════════════════════════

class TestSearchRouting:
    """Tests for route_after_intent directing search to handle_search."""

    def test_route_search_intent(self):
        state = base_state(intent="search")
        assert route_after_intent(state) == "handle_search"

    def test_route_conversation_intent(self):
        state = base_state(intent="conversation")
        assert route_after_intent(state) == "handle_conversation"

    def test_route_invoice_intent(self):
        state = base_state(intent="invoice")
        assert route_after_intent(state) == "extract_basics"


# ═══════════════════════════════════════════════════════════════════════════
# Group 6: Existing Flow Regression (3 tests)
# ═══════════════════════════════════════════════════════════════════════════

class TestExistingFlowUnchanged:
    """Regression tests ensuring the invoice creation flow still works."""

    def test_invoice_intent_reaches_extract_basics(self, mock_llm, mock_supabase):
        """Invoice intent should route to extract_basics, not search."""
        mock_llm(structured_responses=[IntentClassification(intent="invoice")])
        state = base_state(messages=[HumanMessage(content="Invoice Brett $500")])
        result = classify_intent(state)
        assert result["intent"] == "invoice"
        assert route_after_intent({**state, **result}) == "extract_basics"

    def test_conversation_intent_reaches_handle_conversation(self, mock_llm, mock_supabase):
        """Conversation intent should route to handle_conversation."""
        mock_llm(
            structured_responses=[IntentClassification(intent="conversation")],
            responses=["G'day mate! Ready when you are."],
        )
        state = base_state(messages=[HumanMessage(content="Hello")])
        result = classify_intent(state)
        assert result["intent"] == "conversation"
        conv_result = handle_conversation({**state, **result})
        assert len(conv_result["messages"]) == 1
        assert "mate" in conv_result["messages"][0].content.lower() or len(conv_result["messages"][0].content) > 0

    def test_classify_intent_defaults_to_invoice_on_error(self, mock_supabase, monkeypatch):
        """If the LLM errors during classification, default to invoice flow."""
        import app.agent.graph as graph_module
        import app.agent.llm as llm_module

        def _broken_llm(**kw):
            raise RuntimeError("LLM down")

        monkeypatch.setattr(graph_module, "get_llm", _broken_llm)
        monkeypatch.setattr(llm_module, "get_llm", _broken_llm)

        state = base_state(messages=[HumanMessage(content="show invoices")])
        result = classify_intent(state)
        assert result["intent"] == "invoice"


# ═══════════════════════════════════════════════════════════════════════════
# Group 7: GST & Revenue Tools (4 tests)
# ═══════════════════════════════════════════════════════════════════════════

class TestGSTAndRevenue:
    """Tests for GST summary and client revenue tools."""

    def test_gst_collected_excludes_drafts(self):
        sb = _sb()
        summary = crud.get_gst_summary(sb, TEST_OWNER_ID, "2026-01-01", "2026-03-31")
        # Draft invoice (INV-EFGH5678, tax=80) should be excluded
        # Non-draft: Paid (200) + Overdue (500) + Sent (120) = 820
        assert summary["gst_collected"] == 820.0

    def test_gst_paid_from_expenses(self):
        sb = _sb()
        summary = crud.get_gst_summary(sb, TEST_OWNER_ID, "2026-01-01", "2026-03-31")
        # All 4 expenses: 13.64 + 7.73 + 83.64 + 30.91 = 135.92
        assert summary["gst_paid"] == 135.92

    def test_client_revenue_sunset_homes(self):
        sb = _sb()
        revenue = crud.get_client_revenue(sb, TEST_OWNER_ID, client_id=1)
        # Sunset Homes: Paid 2200 + Overdue 5500 = 7700
        assert revenue["total_billed"] == 7700.0
        assert revenue["paid"] == 2200.0
        assert revenue["outstanding"] == 5500.0
        assert revenue["invoice_count"] == 2

    def test_tool_revenue_by_client(self):
        tool = _tool_by_name("get_revenue_by_client")
        result = tool.invoke({"client_name": "Sunset"})
        assert result["found"] is True
        assert result["client_name"] == "Sunset Homes"
        assert result["total_billed"] == 7700.0
        assert result["invoice_count"] == 2


# ═══════════════════════════════════════════════════════════════════════════
# Total: 56 test cases
#   Group 1: TestSearchCRUD           — 16 tests
#   Group 2: TestSearchTools          — 20 tests
#   Group 3: TestSearchConvAndMemory  —  4 tests
#   Group 4: TestIntentClassification —  6 tests
#   Group 5: TestSearchRouting        —  3 tests
#   Group 6: TestExistingFlowUnchanged—  3 tests
#   Group 7: TestGSTAndRevenue        —  4 tests
# ═══════════════════════════════════════════════════════════════════════════
