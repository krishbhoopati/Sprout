from typing import Annotated

from fastapi import APIRouter, Header

from ..config import settings
from ..errors import unauthorized
from ..models.schemas import N8nNotification
from ..supabase_client import get_supabase

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/n8n/weather-notification")
async def n8n_weather_notification(
    body: N8nNotification,
    x_n8n_secret: Annotated[str | None, Header()] = None,
) -> dict:
    """Called by n8n on a schedule. Auth is a shared secret, not a user token."""
    if not settings.n8n_webhook_secret or x_n8n_secret != settings.n8n_webhook_secret:
        raise unauthorized("Invalid or missing n8n secret")

    sb = get_supabase()  # secret key bypasses RLS to write the notification
    sb.table("notifications").insert(
        {
            "user_id": body.user_id,
            "garden_id": body.garden_id,
            "type": body.type,
            "title": body.title,
            "message": body.message,
            "is_read": False,
        }
    ).execute()
    return {"ok": True}
