import os
from langchain_openai import ChatOpenAI


def get_llm(temperature: float = 0):
    """Return a ChatModel based on the LLM_PROVIDER environment variable.

    Supported providers: openai (default), anthropic, deepseek.
    Optionally override the model name with LLM_MODEL.
    """
    provider = os.getenv("LLM_PROVIDER", "openai").lower()
    model = os.getenv("LLM_MODEL")

    if provider == "anthropic":
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=model or "claude-sonnet-4-20250514",
            temperature=temperature,
        )
    elif provider == "deepseek":
        return ChatOpenAI(
            model=model or "deepseek-chat",
            temperature=temperature,
            base_url="https://api.deepseek.com",
            api_key=os.getenv("DEEPSEEK_API_KEY"),
        )
    else:  # default: openai
        return ChatOpenAI(
            model=model or "gpt-4o-mini",
            temperature=temperature,
        )
