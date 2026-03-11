"""One-time script to backfill embeddings for existing user_memories rows.

Usage:
    cd smart-invoice-backend
    python -m scripts.backfill_embeddings
"""

import os
import sys
import time

# Add parent dir so app imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv()

from app.database import get_supabase
from app.memory.embeddings import generate_embedding


def backfill():
    sb = get_supabase()
    result = (
        sb.table("user_memories")
        .select("id, key, value, subject")
        .is_("embedding", "null")
        .execute()
    )
    rows = result.data
    if not rows:
        print("No rows need backfilling.")
        return

    print(f"Backfilling {len(rows)} memories...")
    success = 0
    for i, row in enumerate(rows):
        text = f"{row['key']} {row['value']} {row.get('subject') or ''}".strip()
        embedding = generate_embedding(text)
        if embedding is not None:
            sb.table("user_memories").update({"embedding": str(embedding)}).eq("id", row["id"]).execute()
            success += 1
        else:
            print(f"  [SKIP] Failed to embed row {row['id']}")

        if (i + 1) % 10 == 0:
            print(f"  Processed {i + 1}/{len(rows)}...")
            time.sleep(0.5)  # Rate limit courtesy

    print(f"Done. {success}/{len(rows)} rows updated with embeddings.")


if __name__ == "__main__":
    backfill()
