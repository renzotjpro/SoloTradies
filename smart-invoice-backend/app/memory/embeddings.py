"""Embedding generation utility using OpenAI text-embedding-3-small."""

import logging
import os

from openai import OpenAI

logger = logging.getLogger(__name__)

_client: OpenAI | None = None
MODEL = "text-embedding-3-small"  # 1536 dimensions


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


def generate_embedding(text: str) -> list[float] | None:
    """Generate a 1536-dimension embedding vector for the given text.

    Returns None on failure so callers can gracefully degrade to text search.
    """
    if not text or not text.strip():
        return None
    try:
        resp = _get_client().embeddings.create(input=text.strip(), model=MODEL)
        return resp.data[0].embedding
    except Exception as e:
        logger.warning(f"Embedding generation failed: {e}")
        return None
