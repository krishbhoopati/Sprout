from functools import lru_cache

from supabase import Client, create_client

from .config import settings
from .errors import upstream_unavailable


@lru_cache
def get_supabase() -> Client:
    """Server-side Supabase client using the secret key (may bypass RLS).

    The client is created lazily so the app can boot for local UI work even
    when Supabase credentials are not yet configured.
    """
    if not settings.supabase_configured:
        raise upstream_unavailable(
            "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY."
        )
    return create_client(settings.supabase_url, settings.supabase_secret_key)
