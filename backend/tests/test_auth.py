import time

import jwt
import pytest

from app import auth
from app.config import settings

_SECRET = "test-hs256-secret"


@pytest.fixture(autouse=True)
def _hs256_only(monkeypatch):
    # Force the HS256 fallback path (no JWKS) so tokens can be minted locally.
    monkeypatch.setattr(settings, "supabase_jwks_url", "")
    monkeypatch.setattr(settings, "supabase_jwt_secret", _SECRET)
    monkeypatch.setattr(auth, "_jwks_client", None)


def _token(**overrides) -> str:
    now = int(time.time())
    claims = {"sub": "user-1", "iat": now, "exp": now + 3600, "aud": "authenticated"}
    claims.update(overrides)
    return jwt.encode(claims, _SECRET, algorithm="HS256")


def test_decodes_valid_token():
    assert auth._decode_token(_token())["sub"] == "user-1"


def test_tolerates_small_clock_skew():
    # Supabase's clock can run a few seconds ahead of this machine, so a fresh
    # token's iat may be slightly in the future. It must still verify.
    skewed = _token(iat=int(time.time()) + 5)
    assert auth._decode_token(skewed)["sub"] == "user-1"


def test_rejects_expired_token():
    expired = _token(iat=int(time.time()) - 7200, exp=int(time.time()) - 3600)
    with pytest.raises(Exception) as excinfo:
        auth._decode_token(expired)
    assert "Invalid token" in str(excinfo.value.detail if hasattr(excinfo.value, "detail") else excinfo.value)
