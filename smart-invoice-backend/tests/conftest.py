"""
Shared test fixtures for the SoloTradies agent test suite.

Environment variables are set BEFORE any app modules are imported to prevent
import-time crashes (database.py raises RuntimeError without SUPABASE_URL).
"""

import os

# --- Placeholder env vars (must be set before importing app modules) ---
os.environ.setdefault("OPENAI_API_KEY", "sk-placeholder-for-testing")
os.environ.setdefault("SUPABASE_URL", "https://placeholder.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "placeholder-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "placeholder-jwt-secret")

import pytest
from app.agent.state import AgentState
from tests.fake_data import (
    TEST_OWNER_ID,
    FakeSupabase,
    FakeLLM,
)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def base_state(**kwargs) -> AgentState:
    """Build a minimal valid AgentState for testing."""
    defaults = dict(
        messages=[],
        owner_id=TEST_OWNER_ID,
        intent=None,
        extracted_data=None,
        client_status=None,
        resolved_client_id=None,
        creation_preference=None,
        is_complete=False,
        user_confirmed=False,
        user_declined=False,
        created_invoice_id=None,
    )
    defaults.update(kwargs)
    return AgentState(**defaults)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_supabase(monkeypatch):
    """
    Provide a FakeSupabase and patch it into all modules that call get_supabase().
    Returns the FakeSupabase instance so tests can inspect its internal state.
    """
    fake_sb = FakeSupabase()

    import app.agent.graph as graph_module
    import app.database as db_module

    monkeypatch.setattr(graph_module, "get_supabase", lambda: fake_sb)
    monkeypatch.setattr(db_module, "get_supabase", lambda: fake_sb)

    # Also patch crud module if it imports get_supabase directly
    try:
        import app.crud.crud as crud_module
        if hasattr(crud_module, "get_supabase"):
            monkeypatch.setattr(crud_module, "get_supabase", lambda: fake_sb)
    except (ImportError, AttributeError):
        pass

    return fake_sb


@pytest.fixture
def mock_llm(monkeypatch):
    """
    Provide a FakeLLM factory. Call with responses/structured_responses to get
    a configured FakeLLM, automatically patched into app.agent.llm.get_llm.

    Usage:
        def test_something(mock_llm):
            mock_llm(structured_responses=[IntentClassification(intent="invoice")])
    """
    import app.agent.graph as graph_module
    import app.agent.llm as llm_module

    def _factory(responses=None, structured_responses=None):
        fake = FakeLLM(responses=responses, structured_responses=structured_responses)
        monkeypatch.setattr(graph_module, "get_llm", lambda **kw: fake)
        monkeypatch.setattr(llm_module, "get_llm", lambda **kw: fake)
        return fake

    return _factory


@pytest.fixture(scope="session")
def llm_judge():
    """
    Session-scoped LLM-as-a-Judge instance.
    Skips if no real OPENAI_API_KEY is available.
    """
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key or api_key.startswith("sk-placeholder"):
        pytest.skip("No real OPENAI_API_KEY — skipping LLM judge tests")

    from tests.evaluator import LLMJudge
    return LLMJudge()


@pytest.fixture
def override_auth():
    """
    Override FastAPI's get_current_user dependency so API tests
    don't need a real JWT.
    """
    from main import app as fastapi_app
    from app.auth import get_current_user

    fastapi_app.dependency_overrides[get_current_user] = lambda: TEST_OWNER_ID
    yield
    fastapi_app.dependency_overrides.pop(get_current_user, None)
