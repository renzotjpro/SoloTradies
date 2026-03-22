"""
LLM-as-a-Judge module for evaluating non-deterministic AI agent responses.

Uses gpt-4o-mini (cheap, fast) to grade whether the agent's response meets
specific criteria. This avoids brittle string matching on LLM outputs.

Usage:
    judge = LLMJudge()
    result = judge.assert_response(
        response="Hey! Ready to help with invoicing.",
        criteria="The response is friendly and mentions invoicing",
    )
    assert result.passed
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage


class JudgeResult(BaseModel):
    """Structured output from the evaluation judge."""
    passed: bool = Field(description="Whether the response meets the criteria")
    reasoning: str = Field(description="Brief explanation of the judgement")
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Confidence in the judgement (0.0 to 1.0)",
    )


JUDGE_SYSTEM_PROMPT = (
    "You are an evaluation judge for an AI invoicing assistant called Invoize AI.\n"
    "Your job is to evaluate whether the assistant's response meets the given criteria.\n\n"
    "Be strict but fair:\n"
    "- 'passed' should be true only if the response clearly meets the criteria\n"
    "- Provide brief reasoning (1-2 sentences)\n"
    "- Set confidence based on how clearly the criteria is met or not met\n\n"
    "Respond with structured output matching the JudgeResult schema."
)


class LLMJudge:
    """Evaluator that uses a cheap LLM to grade agent responses."""

    def __init__(self, model: str = "gpt-4o-mini"):
        self._llm = ChatOpenAI(model=model, temperature=0)
        self._structured_llm = self._llm.with_structured_output(JudgeResult)

    def assert_response(
        self,
        response: str,
        criteria: str,
        context: str = "",
    ) -> JudgeResult:
        """
        Evaluate whether a response meets the given criteria.

        Args:
            response: The AI agent's response text to evaluate.
            criteria: Natural language description of what we expect.
            context: Optional conversation context for the judge.

        Returns:
            JudgeResult with .passed, .reasoning, .confidence
        """
        context_section = f"\nCONVERSATION CONTEXT:\n{context}\n" if context else ""

        user_prompt = (
            f"CRITERIA: {criteria}\n"
            f"{context_section}\n"
            f"AI RESPONSE TO EVALUATE:\n{response}"
        )

        result: JudgeResult = self._structured_llm.invoke([
            SystemMessage(content=JUDGE_SYSTEM_PROMPT),
            HumanMessage(content=user_prompt),
        ])
        return result

    # -------------------------------------------------------------------
    # Convenience assertion methods
    # -------------------------------------------------------------------

    def assert_asks_for(self, response: str, field_name: str, context: str = "") -> JudgeResult:
        """Assert the response asks the user to provide a specific field."""
        result = self.assert_response(
            response=response,
            criteria=f"The response asks the user to provide their {field_name}",
            context=context,
        )
        assert result.passed, (
            f"Expected response to ask for '{field_name}' but it didn't.\n"
            f"Reasoning: {result.reasoning}\n"
            f"Response: {response[:200]}"
        )
        return result

    def assert_not_asks_for(self, response: str, field_name: str, context: str = "") -> JudgeResult:
        """Assert the response does NOT ask the user for a specific field."""
        result = self.assert_response(
            response=response,
            criteria=f"The response does NOT ask for or mention needing the user's {field_name}",
            context=context,
        )
        assert result.passed, (
            f"Expected response NOT to ask for '{field_name}' but it did.\n"
            f"Reasoning: {result.reasoning}\n"
            f"Response: {response[:200]}"
        )
        return result

    def assert_contains_summary(self, response: str, context: str = "") -> JudgeResult:
        """Assert the response contains an invoice confirmation summary."""
        result = self.assert_response(
            response=response,
            criteria=(
                "The response contains an invoice summary with at least: "
                "client name, line items with amounts, subtotal, GST, total, "
                "and asks the user to confirm"
            ),
            context=context,
        )
        assert result.passed, (
            f"Expected invoice summary but didn't find one.\n"
            f"Reasoning: {result.reasoning}\n"
            f"Response: {response[:300]}"
        )
        return result

    def assert_friendly_tone(self, response: str, context: str = "") -> JudgeResult:
        """Assert the response has a warm, professional tone."""
        result = self.assert_response(
            response=response,
            criteria="The response is warm, friendly, and professional in tone",
            context=context,
        )
        assert result.passed, (
            f"Expected friendly tone.\n"
            f"Reasoning: {result.reasoning}\n"
            f"Response: {response[:200]}"
        )
        return result

    def assert_mentions(self, response: str, topic: str, context: str = "") -> JudgeResult:
        """Assert the response mentions a specific topic or concept."""
        result = self.assert_response(
            response=response,
            criteria=f"The response mentions or references '{topic}'",
            context=context,
        )
        assert result.passed, (
            f"Expected response to mention '{topic}'.\n"
            f"Reasoning: {result.reasoning}\n"
            f"Response: {response[:200]}"
        )
        return result
