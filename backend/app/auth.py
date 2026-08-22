from typing import Annotated

import jwt
from fastapi import Depends, Header

from .config import settings
from .errors import unauthorized

# Cached JWKS client for asymmetric (RS256/ES256) Supabase tokens.
_jwks_client: jwt.PyJWKClient | None = None


def _get_jwks_client() -> jwt.PyJWKClient | None:
    global _jwks_client
    if not settings.supabase_jwks_url:
        return None
    if _jwks_client is None:
        _jwks_client = jwt.PyJWKClient(settings.supabase_jwks_url)
    return _jwks_client


def _decode_token(token: str) -> dict:
    """Verify a Supabase access token and return its claims.

    Prefers JWKS (asymmetric) verification; falls back to the HS256 shared
    secret if that is how the project signs tokens.
    """
    # Try asymmetric verification via JWKS first.
    jwks = _get_jwks_client()
    if jwks is not None:
        try:
            signing_key = jwks.get_signing_key_from_jwt(token)
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256", "ES256"],
                audience="authenticated",
                options={"verify_aud": False},
            )
        except jwt.PyJWTError:
            pass  # fall through to HS256

    # Fall back to the legacy HS256 shared secret.
    if settings.supabase_jwt_secret:
        try:
            return jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_aud": False},
            )
        except jwt.PyJWTError as exc:
            raise unauthorized(f"Invalid token: {exc}") from exc

    raise unauthorized("Token verification is not configured on the server")


async def current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    """FastAPI dependency returning the authenticated user's ID (sub claim)."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise unauthorized("Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    claims = _decode_token(token)
    user_id = claims.get("sub")
    if not user_id:
        raise unauthorized("Token missing subject claim")
    return user_id


CurrentUser = Annotated[str, Depends(current_user)]
