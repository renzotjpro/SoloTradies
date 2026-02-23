import os

# Note: In a real project, this would be injected via Docker secrets, Azure Key Vault, or .env.
# For testing locally, replace with a real testing key, or mock the LLM responses.
# I am setting a placeholder to prevent the immediate ValidationError from LangChain.
os.environ["OPENAI_API_KEY"] = "sk-placeholder-for-testing"
