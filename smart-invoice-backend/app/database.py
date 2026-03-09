import os
import httpx
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY environment variables are required.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Fix: Supabase-py enables HTTP/2 by default, which causes intermittent
# WinError 10035 socket errors on Windows. Replace the postgrest session
# with an HTTP/1.1 client to avoid this.
_old_session = supabase.postgrest.session
supabase.postgrest.session = httpx.Client(
    base_url=_old_session.base_url,
    headers=dict(_old_session.headers),
    timeout=_old_session.timeout,
)
_old_session.close()


# FastAPI dependency to get Supabase client
def get_supabase() -> Client:
    return supabase
