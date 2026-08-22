import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app

client = TestClient(app)

_BODY = {
    "user_id": "00000000-0000-0000-0000-000000000000",
    "garden_id": None,
    "type": "frost_warning",
    "title": "Frost tonight",
    "message": "Cover tender plants.",
}


@pytest.fixture(autouse=True)
def _set_secret(monkeypatch):
    monkeypatch.setattr(settings, "n8n_webhook_secret", "test-secret")


def test_webhook_rejects_missing_secret():
    # Test 11: the n8n webhook rejects a request with a missing secret.
    resp = client.post("/api/webhooks/n8n/weather-notification", json=_BODY)
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "unauthorized"


def test_webhook_rejects_wrong_secret():
    resp = client.post(
        "/api/webhooks/n8n/weather-notification",
        json=_BODY,
        headers={"X-N8N-Secret": "wrong"},
    )
    assert resp.status_code == 401
