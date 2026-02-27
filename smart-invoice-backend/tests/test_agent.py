import pytest
from langchain_core.messages import HumanMessage
from app.agent.state import AgentState
from app.agent.graph import app as workflow_app


def _base_state(**kwargs) -> AgentState:
    """Helper to build a minimal valid AgentState for testing."""
    defaults = dict(
        messages=[],
        extracted_data=None,
        client_status=None,
        resolved_client_id=None,
        creation_preference=None,
        is_complete=False,
        user_confirmed=False,
        created_invoice_id=None,
    )
    defaults.update(kwargs)
    return AgentState(**defaults)


def test_missing_client_name():
    """
    If no client name is provided, check_client_db should ask for one
    and is_complete should remain False.
    """
    state = _base_state(
        messages=[HumanMessage(content="I cleaned the windows for $150 today.")]
    )

    result = workflow_app.invoke(state)

    assert result["is_complete"] is False
    assert result.get("client_status") is None
    # The agent should ask for a client name
    last_content = result["messages"][-1].content.lower()
    assert "client" in last_content


def test_existing_client_asks_only_invoice_fields(monkeypatch):
    """
    When the DB lookup finds the client, the agent should ask ONLY for
    invoice fields — not for ABN, Contact Name, or Email.
    """
    # Patch Supabase to simulate an existing client record
    import app.agent.graph as graph_module

    class _FakeResult:
        data = [{"id": 42, "name": "Acme Corp", "abn": "51 824 753 556"}]

    class _FakeTable:
        def select(self, *a): return self
        def ilike(self, *a): return self
        def eq(self, *a): return self
        def execute(self): return _FakeResult()

    class _FakeSB:
        def table(self, *a): return _FakeTable()

    monkeypatch.setattr(graph_module, "get_supabase", lambda: _FakeSB())

    state = _base_state(
        messages=[HumanMessage(content="Invoice Acme Corp for website redesign for $2000")]
    )

    result = workflow_app.invoke(state)

    assert result.get("client_status") == "existing"
    assert result.get("resolved_client_id") == 42
    # Should NOT ask for ABN, Contact, or Email
    last_content = result["messages"][-1].content.lower()
    assert "abn" not in last_content
    assert "contact" not in last_content
    assert "email" not in last_content


def test_unknown_client_shows_two_options(monkeypatch):
    """
    When the DB lookup finds no client, the agent should present the
    two-choice preference message.
    """
    import app.agent.graph as graph_module

    class _FakeResult:
        data = []

    class _FakeTable:
        def select(self, *a): return self
        def ilike(self, *a): return self
        def eq(self, *a): return self
        def execute(self): return _FakeResult()

    class _FakeSB:
        def table(self, *a): return _FakeTable()

    monkeypatch.setattr(graph_module, "get_supabase", lambda: _FakeSB())

    state = _base_state(
        messages=[HumanMessage(content="Invoice Unknown Corp for tile work $3000")]
    )

    result = workflow_app.invoke(state)

    assert result.get("client_status") == "not_found"
    last_content = result["messages"][-1].content
    # Both options should appear
    assert "1" in last_content
    assert "2" in last_content
