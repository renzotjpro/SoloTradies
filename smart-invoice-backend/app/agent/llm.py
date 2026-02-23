import os
from langchain_openai import ChatOpenAI

# Initialize the default LLM (OpenAI)
# In the future, we can add a configuration variable to switch to DeepSeek here
# e.g. if os.getenv("LLM_PROVIDER") == "deepseek": return ChatDeepSeek(...)

def get_llm():
    # Return GPT-4o-mini as a fast, capable default for extraction
    return ChatOpenAI(model="gpt-4o-mini", temperature=0)
