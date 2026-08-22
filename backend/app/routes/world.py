from datetime import datetime, timezone

from fastapi import APIRouter

from ..auth import CurrentUser
from ..errors import not_found
from ..models.schemas import WorldStartResponse, WorldStatusResponse
from ..services import world_labs
from ..supabase_client import get_supabase

router = APIRouter(prefix="/api/gardens", tags=["world"])

# Seconds the mock pretends to spend generating before reporting "ready".
_MOCK_DELAY_SECONDS = 3


def _fetch_owned_garden(garden_id: str, user_id: str) -> dict:
    sb = get_supabase()
    res = (
        sb.table("gardens")
        .select("*")
        .eq("id", garden_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise not_found("Garden not found")
    return res.data[0]


@router.post("/{garden_id}/world", response_model=WorldStartResponse)
async def start_world(garden_id: str, user_id: CurrentUser) -> WorldStartResponse:
    garden = _fetch_owned_garden(garden_id, user_id)
    sb = get_supabase()

    image_signed_url = ""
    if not world_labs.is_mock() and garden.get("image_path"):
        signed = sb.storage.from_("garden-images").create_signed_url(
            garden["image_path"], 3600
        )
        image_signed_url = signed.get("signedURL") or signed.get("signedUrl", "")

    operation_id, status = await world_labs.start_generation(image_signed_url)
    sb.table("world_generations").insert(
        {
            "garden_id": garden_id,
            "operation_id": operation_id,
            "status": status,
        }
    ).execute()
    return WorldStartResponse(operation_id=operation_id, status=status)


@router.get("/{garden_id}/world/status", response_model=WorldStatusResponse)
async def world_status(garden_id: str, user_id: CurrentUser) -> WorldStatusResponse:
    _fetch_owned_garden(garden_id, user_id)
    sb = get_supabase()
    res = (
        sb.table("world_generations")
        .select("*")
        .eq("garden_id", garden_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise not_found("No world generation found for this garden")
    row = res.data[0]

    if row["status"] in ("ready", "failed"):
        return WorldStatusResponse(
            status=row["status"],
            result_url=row.get("result_url"),
            error_message=row.get("error_message"),
        )

    if world_labs.is_mock():
        created = datetime.fromisoformat(str(row["created_at"]).replace("Z", "+00:00"))
        age = (datetime.now(timezone.utc) - created).total_seconds()
        if age < _MOCK_DELAY_SECONDS:
            return WorldStatusResponse(status="processing")
        sb.table("world_generations").update(
            {"status": "ready", "result_url": world_labs.DEMO_WORLD_URL}
        ).eq("id", row["id"]).execute()
        return WorldStatusResponse(status="ready", result_url=world_labs.DEMO_WORLD_URL)

    status, result_url, error = await world_labs.check_status(row["operation_id"])
    sb.table("world_generations").update(
        {"status": status, "result_url": result_url, "error_message": error}
    ).eq("id", row["id"]).execute()
    return WorldStatusResponse(status=status, result_url=result_url, error_message=error)
