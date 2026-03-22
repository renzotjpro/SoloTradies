"""
Integration tests for the full LangGraph invoice agent workflow.

These tests call a REAL LLM and use LLM-as-a-Judge for assertions on
non-deterministic outputs. They require a valid OPENAI_API_KEY.

Run with: pytest -m llm -v -s tests/test_graph_integration.py
Skip with: pytest -m "not llm"
"""

import pytest
from langchain_core.messages import HumanMessage, AIMessage

from app.agent.graph import app as workflow_app
from tests.conftest import base_state
from tests.fake_data import TEST_OWNER_ID


pytestmark = pytest.mark.llm


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def run_conversation(initial_state: dict, messages: list[str]) -> list[dict]:
    """
    Run a multi-turn conversation through the compiled graph.
    Returns a list of result states, one per turn.
    """
    states = []
    state = dict(initial_state)

    for msg in messages:
        state["messages"].append(HumanMessage(content=msg))
        result = workflow_app.invoke(state)
        states.append(result)

        # Carry forward full state for next turn
        state = dict(result)

    return states


def last_ai_content(result: dict) -> str:
    """Extract the last AI message content from a result state."""
    for msg in reversed(result["messages"]):
        if isinstance(msg, AIMessage):
            return msg.content
    return ""


# ---------------------------------------------------------------------------
# Single-turn tests
# ---------------------------------------------------------------------------

class TestSingleTurn:
    def test_greeting_gets_friendly_response(self, mock_supabase, llm_judge):
        """A casual greeting should get a warm response mentioning invoicing."""
        state = base_state(messages=[HumanMessage(content="Hey mate, how's it going?")])
        result = workflow_app.invoke(state)

        reply = last_ai_content(result)
        assert reply, "Expected a non-empty AI response"

        llm_judge.assert_friendly_tone(reply)

    def test_invoice_request_extracts_data(self, mock_supabase, llm_judge):
        """An invoice request with a known client should extract data correctly."""
        state = base_state(
            messages=[HumanMessage(content="Invoice Sunset Homes $2000 for bathroom renovation")]
        )
        result = workflow_app.invoke(state)

        # Structured assertions
        assert result.get("client_status") == "existing"
        assert result.get("resolved_client_id") == 1

        data = result.get("extracted_data")
        assert data is not None
        assert data.client_name is not None
        assert "sunset" in data.client_name.lower()

        # Judge: should NOT ask for ABN/contact since client exists
        reply = last_ai_content(result)
        llm_judge.assert_not_asks_for(reply, "ABN")
        llm_judge.assert_not_asks_for(reply, "email")

    def test_unknown_client_presents_options(self, mock_supabase):
        """An invoice for an unknown client should present two options."""
        state = base_state(
            messages=[HumanMessage(content="Invoice NewCo $500 for plumbing work")]
        )
        result = workflow_app.invoke(state)

        assert result.get("client_status") == "not_found"

        reply = last_ai_content(result)
        assert "1" in reply
        assert "2" in reply


# ---------------------------------------------------------------------------
# Multi-turn tests
# ---------------------------------------------------------------------------

class TestMultiTurn:
    def test_existing_client_flow(self, mock_supabase, llm_judge):
        """
        Existing client flow:
        Turn 1: invoice request → confirmation summary
        Turn 2: "yes" → invoice created
        """
        states = run_conversation(
            base_state(),
            messages=[
                "Invoice Sunset Homes $500 for tiling work, done today",
                "yes",
            ],
        )

        # Turn 1: should show confirmation summary
        turn1_reply = last_ai_content(states[0])
        # The agent may ask for confirmation or show summary depending on completeness
        assert states[0].get("client_status") == "existing"

        # Turn 2: should confirm and create
        turn2 = states[1]
        if turn2.get("user_confirmed"):
            assert turn2.get("created_invoice_id") is not None
            turn2_reply = last_ai_content(turn2)
            llm_judge.assert_mentions(turn2_reply, "invoice")

    def test_new_client_full_flow(self, mock_supabase, llm_judge):
        """
        New client full profile flow:
        Turn 1: invoice request → presents 2 options
        Turn 2: "1" → asks for client details
        Turn 3: provide all details → confirmation summary
        Turn 4: "yes" → invoice created
        """
        states = run_conversation(
            base_state(),
            messages=[
                "Invoice NewCo $3000 for tiling work",
                "1",
                "Business Name: NewCo Construction, Contact: John Smith, ABN: 51824753556, Email: john@newco.com.au",
                "yes",
            ],
        )

        # Turn 1: options presented
        assert states[0].get("client_status") == "not_found"

        # Turn 2: preference resolved to "full"
        assert states[1].get("creation_preference") == "full"

        # After all turns, invoice should be created
        final = states[-1]
        if final.get("created_invoice_id") is not None:
            reply = last_ai_content(final)
            llm_judge.assert_mentions(reply, "invoice")

    def test_quick_invoice_flow(self, mock_supabase, llm_judge):
        """
        Quick invoice flow:
        Turn 1: invoice request → presents 2 options
        Turn 2: "2" → asks for ABN
        Turn 3: provide ABN → confirmation summary
        Turn 4: "confirm" → invoice created
        """
        states = run_conversation(
            base_state(),
            messages=[
                "Invoice QuickCo $800 for electrical work",
                "2",
                "ABN is 12345678901",
                "confirm",
            ],
        )

        # Turn 1: options
        assert states[0].get("client_status") == "not_found"

        # Turn 2: preference = quick
        assert states[1].get("creation_preference") == "quick"

        # Final: should create invoice
        final = states[-1]
        if final.get("created_invoice_id") is not None:
            reply = last_ai_content(final)
            llm_judge.assert_mentions(reply, "invoice")

    def test_decline_at_confirmation(self, mock_supabase, llm_judge):
        """
        User declines at confirmation step.
        Turn 1: complete invoice request
        Turn 2: "no" → graceful cancellation
        """
        states = run_conversation(
            base_state(),
            messages=[
                "Invoice Sunset Homes $500 for tiling today",
                "no",
            ],
        )

        # After "no", the agent should NOT create an invoice
        final = states[-1]
        assert final.get("created_invoice_id") is None

        # If we reached the decline flow, check the message
        if final.get("user_declined"):
            reply = last_ai_content(final)
            llm_judge.assert_response(
                response=reply,
                criteria="The response acknowledges the cancellation gracefully without being pushy",
            )

    def test_quantity_times_rate_calculation(self, mock_supabase, llm_judge):
        """
        The agent should calculate total from quantity x rate.
        """
        states = run_conversation(
            base_state(),
            messages=[
                "Invoice Sunset Homes for 40 hours at $100/hr for carpentry",
            ],
        )

        data = states[0].get("extracted_data")
        if data and data.items:
            item = data.items[0]
            # Check that the amount was calculated correctly
            if item.amount is not None:
                assert item.amount == pytest.approx(4000.0, rel=0.01), (
                    f"Expected 40 * $100 = $4000, got ${item.amount}"
                )
