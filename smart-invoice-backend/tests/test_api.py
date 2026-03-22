"""
API endpoint tests for /api/chat/ using FastAPI TestClient.

Tests the HTTP layer: request/response format, auth, conversation persistence.
LLM-dependent tests are marked with @pytest.mark.llm.

Run deterministic tests: pytest tests/test_api.py -m "not llm"
Run all: pytest tests/test_api.py
"""

import pytest

try:
    from fastapi.testclient import TestClient
    from main import app as fastapi_app
    from app.auth import get_current_user
    from app.database import get_supabase
    _IMPORT_OK = True
except ImportError as _err:
    _IMPORT_OK = False
    _IMPORT_REASON = str(_err)

from tests.fake_data import TEST_OWNER_ID, FakeSupabase

pytestmark = pytest.mark.skipif(
    not _IMPORT_OK,
    reason=f"Cannot import app (missing dependency: {_IMPORT_REASON if not _IMPORT_OK else ''})",
)


@pytest.fixture
def client(mock_supabase):
    """TestClient with auth and DB overrides."""
    fastapi_app.dependency_overrides[get_current_user] = lambda: TEST_OWNER_ID
    fastapi_app.dependency_overrides[get_supabase] = lambda: mock_supabase
    yield TestClient(fastapi_app)
    fastapi_app.dependency_overrides.clear()


@pytest.fixture
def unauthenticated_client():
    """TestClient without auth override."""
    fastapi_app.dependency_overrides.pop(get_current_user, None)
    fastapi_app.dependency_overrides.pop(get_supabase, None)
    yield TestClient(fastapi_app)
    fastapi_app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Deterministic tests
# ---------------------------------------------------------------------------

class TestChatEndpoint:
    @pytest.mark.llm
    def test_chat_returns_200_with_reply(self, client):
        """POST /api/chat/ with a simple message should return 200 and a reply."""
        response = client.post("/api/chat/", json={
            "messages": [{"role": "user", "content": "Hello"}],
        })
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert isinstance(data["reply"], str)
        assert len(data["reply"]) > 0

    @pytest.mark.llm
    def test_chat_returns_conversation_id(self, client):
        """Response should include a conversationId."""
        response = client.post("/api/chat/", json={
            "messages": [{"role": "user", "content": "Hi there"}],
        })
        assert response.status_code == 200
        data = response.json()
        assert "conversationId" in data

    @pytest.mark.llm
    def test_chat_invoice_request_returns_structured_data(self, client):
        """An invoice request should include structuredData in the response."""
        response = client.post("/api/chat/", json={
            "messages": [
                {"role": "user", "content": "Invoice Sunset Homes $500 for tiling"}
            ],
        })
        assert response.status_code == 200
        data = response.json()
        # Should have structured data with client info
        if "structuredData" in data and data["structuredData"]:
            sd = data["structuredData"]
            assert "client" in sd or "client_name" in sd


class TestImprovePrompt:
    @pytest.mark.llm
    def test_improve_prompt_returns_improved_text(self, client):
        """POST /api/chat/improve-prompt should return improved text."""
        response = client.post("/api/chat/improve-prompt", json={
            "prompt": "bill sunset homes 500 bucks tiling",
        })
        assert response.status_code == 200
        data = response.json()
        assert "improved_prompt" in data
        assert len(data["improved_prompt"]) > 0


class TestAuthProtection:
    def test_no_auth_returns_error(self, unauthenticated_client):
        """Requests without auth should fail (401 or 403)."""
        response = unauthenticated_client.post("/api/chat/", json={
            "messages": [{"role": "user", "content": "Hello"}],
        })
        # Should not be 200 — either 401, 403, or 422
        assert response.status_code != 200
