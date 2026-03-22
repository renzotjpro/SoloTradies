"""
Deterministic unit tests for individual LangGraph agent nodes.

All tests use mocked LLM + mocked Supabase — no API keys needed.
Run with: pytest tests/test_nodes_unit.py
"""

import pytest
from langchain_core.messages import HumanMessage, AIMessage

from app.agent.state import (
    InvoiceData,
    InvoiceLineItem,
    NewClientDetails,
    BasicExtraction,
    validate_abn,
)
from app.agent.graph import (
    classify_intent,
    handle_conversation,
    extract_basics,
    check_client_db,
    resolve_creation_preference,
    validate_existing_client,
    validate_new_client_full,
    validate_quick_invoice,
    confirm_invoice,
    IntentClassification,
    route_after_intent,
    route_after_db_check,
    route_after_preference,
    route_after_validation,
    route_after_confirmation,
    _PreferenceSchema,
)
from tests.conftest import base_state
from tests.fake_data import TEST_OWNER_ID


def make_invoice_data(**kwargs) -> InvoiceData:
    """Create InvoiceData with sensible defaults for all required fields."""
    defaults = dict(
        client_name=None,
        is_new_client=None,
        new_client_details=None,
        items=None,
        date=None,
        due_date=None,
        abn=None,
    )
    defaults.update(kwargs)
    return InvoiceData(**defaults)


# ===================================================================
# classify_intent
# ===================================================================

class TestClassifyIntent:
    def test_greeting_classified_as_conversation(self, mock_supabase, mock_llm):
        mock_llm(structured_responses=[IntentClassification(intent="conversation")])
        state = base_state(messages=[HumanMessage(content="Hey, how are you?")])
        result = classify_intent(state)
        assert result["intent"] == "conversation"

    def test_invoice_request_classified_as_invoice(self, mock_supabase, mock_llm):
        mock_llm(structured_responses=[IntentClassification(intent="invoice")])
        state = base_state(messages=[HumanMessage(content="Invoice Sunset Homes $500 for tiling")])
        result = classify_intent(state)
        assert result["intent"] == "invoice"

    def test_error_defaults_to_invoice(self, mock_supabase, mock_llm):
        """When the LLM fails, classify_intent should default to 'invoice'."""
        mock_llm(structured_responses=[])  # will raise RuntimeError
        state = base_state(messages=[HumanMessage(content="something")])
        result = classify_intent(state)
        assert result["intent"] == "invoice"


# ===================================================================
# handle_conversation
# ===================================================================

class TestHandleConversation:
    def test_returns_ai_message(self, mock_supabase, mock_llm):
        mock_llm(responses=["Hey! Ready to help with invoicing."])
        state = base_state(messages=[HumanMessage(content="Hello")])
        result = handle_conversation(state)
        assert len(result["messages"]) == 1
        assert isinstance(result["messages"][0], AIMessage)
        assert "invoicing" in result["messages"][0].content.lower()

    def test_error_returns_fallback(self, mock_supabase, mock_llm):
        mock_llm(responses=[])  # will raise RuntimeError
        state = base_state(messages=[HumanMessage(content="Hi")])
        result = handle_conversation(state)
        assert len(result["messages"]) == 1
        # Fallback message mentions "invoicing"
        assert "invoic" in result["messages"][0].content.lower()


# ===================================================================
# extract_basics
# ===================================================================

class TestExtractBasics:
    def test_full_extraction(self, mock_supabase, mock_llm):
        extraction = BasicExtraction(
            client_name="Sunset Homes",
            items=[InvoiceLineItem(description="Tiling", amount=500.0)],
            date="2026-03-13",
        )
        mock_llm(structured_responses=[extraction])
        state = base_state(messages=[HumanMessage(content="Invoice Sunset Homes $500 for tiling")])
        result = extract_basics(state)

        data = result["extracted_data"]
        assert data.client_name == "Sunset Homes"
        assert len(data.items) == 1
        assert data.items[0].amount == 500.0
        assert data.date == "2026-03-13"

    def test_merges_with_existing_state(self, mock_supabase, mock_llm):
        """New extraction should merge with prior-turn data."""
        existing = make_invoice_data(client_name="Sunset Homes")
        extraction = BasicExtraction(
            client_name=None,  # not re-extracted
            items=[InvoiceLineItem(description="Painting", amount=1000.0)],
            date="2026-03-13",
        )
        mock_llm(structured_responses=[extraction])
        state = base_state(
            messages=[HumanMessage(content="$1000 for painting")],
            extracted_data=existing,
        )
        result = extract_basics(state)

        data = result["extracted_data"]
        assert data.client_name == "Sunset Homes"  # preserved from prior turn
        assert data.items[0].amount == 1000.0  # from new extraction

    def test_preserves_new_client_details(self, mock_supabase, mock_llm):
        """Partial new_client_details should accumulate across turns."""
        existing = make_invoice_data(
            client_name="NewCo",
            new_client_details=NewClientDetails(
                business_name="NewCo Construction",
                contact_name=None, abn=None, email=None,
            ),
        )
        extraction = BasicExtraction(
            client_name="NewCo",
            new_client_details=NewClientDetails(
                business_name=None, contact_name=None,
                abn="51824753556", email=None,
            ),
        )
        mock_llm(structured_responses=[extraction])
        state = base_state(
            messages=[HumanMessage(content="ABN is 51824753556")],
            extracted_data=existing,
        )
        result = extract_basics(state)

        details = result["extracted_data"].new_client_details
        assert details.business_name == "NewCo Construction"  # from prior
        assert details.abn == "51824753556"  # from new


# ===================================================================
# check_client_db
# ===================================================================

class TestCheckClientDB:
    def test_client_found(self, mock_supabase):
        data = make_invoice_data(client_name="Sunset Homes")
        state = base_state(extracted_data=data)
        result = check_client_db(state)

        assert result["client_status"] == "existing"
        assert result["resolved_client_id"] == 1

    def test_client_not_found(self, mock_supabase):
        data = make_invoice_data(client_name="Unknown Corp")
        state = base_state(extracted_data=data)
        result = check_client_db(state)

        assert result["client_status"] == "not_found"

    def test_no_client_name_asks_for_one(self, mock_supabase):
        state = base_state(extracted_data=None)
        result = check_client_db(state)

        assert result["client_status"] is None
        assert len(result["messages"]) == 1
        assert "client" in result["messages"][0].content.lower()

    def test_already_resolved_skips_db(self, mock_supabase):
        data = make_invoice_data(client_name="Sunset Homes")
        state = base_state(
            extracted_data=data,
            client_status="existing",
            resolved_client_id=1,
        )
        result = check_client_db(state)
        assert result == {}  # no-op


# ===================================================================
# resolve_creation_preference
# ===================================================================

class TestResolveCreationPreference:
    def test_fast_path_option_1(self, mock_supabase):
        data = make_invoice_data(client_name="NewCo")
        state = base_state(
            messages=[HumanMessage(content="1")],
            extracted_data=data,
        )
        result = resolve_creation_preference(state)
        assert result["creation_preference"] == "full"

    def test_fast_path_option_2(self, mock_supabase):
        data = make_invoice_data(client_name="NewCo")
        state = base_state(
            messages=[HumanMessage(content="2")],
            extracted_data=data,
        )
        result = resolve_creation_preference(state)
        assert result["creation_preference"] == "quick"

    def test_already_set_returns_same(self, mock_supabase):
        state = base_state(creation_preference="full")
        result = resolve_creation_preference(state)
        assert result["creation_preference"] == "full"

    def test_llm_fallback_for_ambiguous(self, mock_supabase, mock_llm):
        mock_llm(structured_responses=[_PreferenceSchema(preference="quick")])
        data = make_invoice_data(client_name="NewCo")
        state = base_state(
            messages=[HumanMessage(content="just the invoice please")],
            extracted_data=data,
        )
        result = resolve_creation_preference(state)
        assert result["creation_preference"] == "quick"


# ===================================================================
# validate_existing_client
# ===================================================================

class TestValidateExistingClient:
    def test_complete_with_items_and_date(self, mock_supabase):
        data = make_invoice_data(
            client_name="Sunset Homes",
            items=[InvoiceLineItem(description="Tiling", amount=500.0)],
            date="2026-03-13",
        )
        state = base_state(extracted_data=data)
        result = validate_existing_client(state)
        assert result["is_complete"] is True

    def test_missing_items(self, mock_supabase, mock_llm):
        mock_llm(responses=["I need the service items and amounts."])
        data = make_invoice_data(client_name="Sunset Homes", date="2026-03-13")
        state = base_state(extracted_data=data)
        result = validate_existing_client(state)
        assert result["is_complete"] is False

    def test_items_without_amount_are_incomplete(self, mock_supabase, mock_llm):
        mock_llm(responses=["Please provide amounts for each item."])
        data = make_invoice_data(
            client_name="Sunset Homes",
            items=[InvoiceLineItem(description="Tiling", amount=None)],
            date="2026-03-13",
        )
        state = base_state(extracted_data=data)
        result = validate_existing_client(state)
        assert result["is_complete"] is False

    def test_defaults_date_to_today(self, mock_supabase):
        data = make_invoice_data(
            client_name="Sunset Homes",
            items=[InvoiceLineItem(description="Tiling", amount=500.0)],
        )
        state = base_state(extracted_data=data)
        result = validate_existing_client(state)
        assert result["is_complete"] is True
        assert data.date is not None  # defaulted to today


# ===================================================================
# validate_new_client_full
# ===================================================================

class TestValidateNewClientFull:
    def test_complete_with_all_fields(self, mock_supabase):
        data = make_invoice_data(
            client_name="NewCo",
            items=[InvoiceLineItem(description="Plumbing", amount=300.0)],
            date="2026-03-13",
            new_client_details=NewClientDetails(
                business_name="NewCo Construction",
                contact_name="John Smith",
                abn="51824753556",
                email="john@newco.com.au",
            ),
        )
        state = base_state(extracted_data=data)
        result = validate_new_client_full(state)
        assert result["is_complete"] is True

    def test_missing_abn(self, mock_supabase, mock_llm):
        mock_llm(responses=["I need the ABN."])
        data = make_invoice_data(
            client_name="NewCo",
            items=[InvoiceLineItem(description="Plumbing", amount=300.0)],
            date="2026-03-13",
            new_client_details=NewClientDetails(
                business_name="NewCo",
                contact_name="John",
                abn=None,
                email="john@newco.com.au",
            ),
        )
        state = base_state(extracted_data=data)
        result = validate_new_client_full(state)
        assert result["is_complete"] is False

    def test_invalid_abn(self, mock_supabase, mock_llm):
        mock_llm(responses=["That ABN is not valid."])
        data = make_invoice_data(
            client_name="NewCo",
            items=[InvoiceLineItem(description="Plumbing", amount=300.0)],
            date="2026-03-13",
            new_client_details=NewClientDetails(
                business_name="NewCo",
                contact_name="John",
                abn="123",  # too short
                email="john@newco.com.au",
            ),
        )
        state = base_state(extracted_data=data)
        result = validate_new_client_full(state)
        assert result["is_complete"] is False

    def test_marks_is_new_client(self, mock_supabase):
        data = make_invoice_data(
            client_name="NewCo",
            items=[InvoiceLineItem(description="Plumbing", amount=300.0)],
            date="2026-03-13",
            new_client_details=NewClientDetails(
                business_name="NewCo",
                contact_name="John",
                abn="51824753556",
                email="john@newco.com.au",
            ),
        )
        state = base_state(extracted_data=data)
        validate_new_client_full(state)
        assert data.is_new_client is True


# ===================================================================
# validate_quick_invoice
# ===================================================================

class TestValidateQuickInvoice:
    def test_complete_with_items_and_abn(self, mock_supabase):
        data = make_invoice_data(
            client_name="QuickCo",
            items=[InvoiceLineItem(description="Electrical", amount=800.0)],
            date="2026-03-13",
            abn="12345678901",
        )
        state = base_state(extracted_data=data)
        result = validate_quick_invoice(state)
        assert result["is_complete"] is True
        # ABN should be formatted
        assert result["extracted_data"].abn == "12 345 678 901"

    def test_missing_abn(self, mock_supabase):
        data = make_invoice_data(
            client_name="QuickCo",
            items=[InvoiceLineItem(description="Electrical", amount=800.0)],
            date="2026-03-13",
        )
        state = base_state(extracted_data=data)
        result = validate_quick_invoice(state)
        assert result["is_complete"] is False

    def test_invalid_abn(self, mock_supabase):
        data = make_invoice_data(
            client_name="QuickCo",
            items=[InvoiceLineItem(description="Electrical", amount=800.0)],
            date="2026-03-13",
            abn="999",
        )
        state = base_state(extracted_data=data)
        result = validate_quick_invoice(state)
        assert result["is_complete"] is False

    def test_no_data_asks_for_items_and_abn(self, mock_supabase):
        state = base_state(extracted_data=None)
        result = validate_quick_invoice(state)
        assert result["is_complete"] is False
        assert "ABN" in result["messages"][0].content


# ===================================================================
# confirm_invoice
# ===================================================================

class TestConfirmInvoice:
    def _complete_data(self):
        return make_invoice_data(
            client_name="Sunset Homes",
            items=[InvoiceLineItem(description="Tiling", amount=500.0)],
            date="2026-03-13",
        )

    def test_shows_summary_on_first_display(self, mock_supabase):
        data = self._complete_data()
        # No prior human message to detect yes/no
        state = base_state(
            messages=[],
            extracted_data=data,
            client_status="existing",
            is_complete=True,
        )
        result = confirm_invoice(state)
        content = result["messages"][0].content
        assert "Subtotal" in content
        assert "GST" in content
        assert "Shall I go ahead" in content

    def test_yes_confirms(self, mock_supabase):
        data = self._complete_data()
        state = base_state(
            messages=[HumanMessage(content="yes")],
            extracted_data=data,
            client_status="existing",
            is_complete=True,
        )
        result = confirm_invoice(state)
        assert result["user_confirmed"] is True

    def test_no_declines(self, mock_supabase):
        data = self._complete_data()
        state = base_state(
            messages=[HumanMessage(content="no")],
            extracted_data=data,
            client_status="existing",
            is_complete=True,
        )
        result = confirm_invoice(state)
        assert result.get("user_declined") is True
        assert result["user_confirmed"] is False

    def test_summary_includes_gst_calculation(self, mock_supabase):
        data = make_invoice_data(
            client_name="Sunset Homes",
            items=[InvoiceLineItem(description="Tiling", amount=1000.0)],
            date="2026-03-13",
        )
        state = base_state(messages=[], extracted_data=data)
        result = confirm_invoice(state)
        content = result["messages"][0].content
        assert "$1,000.00" in content  # subtotal
        assert "$100.00" in content  # GST
        assert "$1,100.00" in content  # total


# ===================================================================
# Routing functions (pure logic, no mocks needed)
# ===================================================================

class TestRoutingFunctions:
    def test_route_after_intent_conversation(self):
        state = base_state(intent="conversation")
        assert route_after_intent(state) == "handle_conversation"

    def test_route_after_intent_invoice(self):
        state = base_state(intent="invoice")
        assert route_after_intent(state) == "extract_basics"

    def test_route_after_intent_none_defaults_to_extract(self):
        state = base_state(intent=None)
        assert route_after_intent(state) == "extract_basics"

    def test_route_after_db_check_existing(self):
        state = base_state(client_status="existing")
        assert route_after_db_check(state) == "validate_existing_client"

    def test_route_after_db_check_not_found_no_prior_prompt(self):
        state = base_state(client_status="not_found", messages=[])
        assert route_after_db_check(state) == "ask_creation_preference"

    def test_route_after_db_check_not_found_with_prior_prompt(self):
        state = base_state(
            client_status="not_found",
            messages=[AIMessage(content="How would you like to proceed?")],
        )
        assert route_after_db_check(state) == "resolve_creation_preference"

    def test_route_after_db_check_none(self):
        from langgraph.graph import END
        state = base_state(client_status=None)
        assert route_after_db_check(state) == END

    def test_route_after_preference_full(self):
        state = base_state(creation_preference="full")
        assert route_after_preference(state) == "validate_new_client_full"

    def test_route_after_preference_quick(self):
        state = base_state(creation_preference="quick")
        assert route_after_preference(state) == "validate_quick_invoice"

    def test_route_after_preference_none(self):
        from langgraph.graph import END
        state = base_state(creation_preference=None)
        assert route_after_preference(state) == END

    def test_route_after_validation_complete(self):
        state = base_state(is_complete=True)
        assert route_after_validation(state) == "confirm_invoice"

    def test_route_after_validation_incomplete(self):
        from langgraph.graph import END
        state = base_state(is_complete=False)
        assert route_after_validation(state) == END

    def test_route_after_confirmation_confirmed(self):
        state = base_state(user_confirmed=True)
        assert route_after_confirmation(state) == "generate_invoice"

    def test_route_after_confirmation_not_confirmed(self):
        from langgraph.graph import END
        state = base_state(user_confirmed=False)
        assert route_after_confirmation(state) == END


# ===================================================================
# validate_abn utility
# ===================================================================

class TestValidateABN:
    def test_valid_abn_with_spaces(self):
        assert validate_abn("51 824 753 556") == "51 824 753 556"

    def test_valid_abn_no_spaces(self):
        assert validate_abn("51824753556") == "51 824 753 556"

    def test_valid_abn_with_dashes(self):
        assert validate_abn("51-824-753-556") == "51 824 753 556"

    def test_invalid_abn_too_short(self):
        assert validate_abn("123") is None

    def test_invalid_abn_too_long(self):
        assert validate_abn("123456789012") is None

    def test_empty_string(self):
        assert validate_abn("") is None
