from datetime import datetime, timezone

from fastapi import APIRouter, Body, Response

from ..auth import CurrentUser
from ..errors import not_found
from ..models.schemas import (
    WorldAssetsResponse,
    WorldStartRequest,
    WorldStartResponse,
    WorldStatusResponse,
)
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


def _latest_generation(garden_id: str) -> dict | None:
    sb = get_supabase()
    res = (
        sb.table("world_generations")
        .select("*")
        .eq("garden_id", garden_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def _garden_prompt(garden: dict, crops: list[str] | None = None) -> str:
    """A short text prompt to steer generation toward a realistic garden.

    When the plan's crops are known they are named explicitly so the generated
    world features the vegetables the user actually planned.
    """
    sun = {
        "full_sun": "sunny",
        "partial_sun": "partly shaded",
        "shade": "shaded",
    }.get(garden.get("sunlight_level", ""), "")

    crop_names = [c.strip() for c in (crops or []) if c and c.strip()]
    if crop_names:
        # Keep the prompt focused; too many names dilute the generation.
        shown = crop_names[:8]
        crop_phrase = "growing " + ", ".join(shown)
    else:
        crop_phrase = "with raised beds of leafy greens and vegetables"

    return (
        f"A {sun} backyard vegetable garden, about "
        f"{garden.get('width_m')}m by {garden.get('length_m')}m, {crop_phrase}, "
        "in raised beds, photorealistic, natural daylight."
    )


@router.post("/{garden_id}/world", response_model=WorldStartResponse)
async def start_world(
    garden_id: str,
    user_id: CurrentUser,
    body: WorldStartRequest | None = Body(default=None),
) -> WorldStartResponse:
    garden = _fetch_owned_garden(garden_id, user_id)
    sb = get_supabase()
    crops = body.crops if body else []

    image_bytes: bytes | None = None
    extension = "jpg"
    if not world_labs.is_mock() and garden.get("image_path"):
        path = garden["image_path"]
        extension = path.rsplit(".", 1)[-1] if "." in path else "jpg"
        try:
            image_bytes = sb.storage.from_("garden-images").download(path)
        except Exception:  # noqa: BLE001 — fall back to a text prompt if download fails
            image_bytes = None

    operation_id, status = await world_labs.start_generation(
        image_bytes, extension, _garden_prompt(garden, crops)
    )
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
    row = _latest_generation(garden_id)
    if not row:
        raise not_found("No world generation found for this garden")

    if row["status"] in ("ready", "failed"):
        return WorldStatusResponse(
            status=row["status"],
            result_url=row.get("result_url"),
            error_message=row.get("error_message"),
            world_id=row.get("world_id"),
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

    status, world_id, result_url, error = await world_labs.check_status(
        row["operation_id"]
    )
    sb.table("world_generations").update(
        {
            "status": status,
            "world_id": world_id,
            "result_url": result_url,
            "error_message": error,
        }
    ).eq("id", row["id"]).execute()
    return WorldStatusResponse(
        status=status, result_url=result_url, error_message=error, world_id=world_id
    )


# Preferred splat quality for the in-app viewer: 500k is Marble's default
# balance of fidelity and download size; smaller tiers are fallbacks.
_SPLAT_QUALITY_ORDER = ("500k", "150k", "100k", "full_res")


@router.get("/{garden_id}/world/assets", response_model=WorldAssetsResponse)
async def world_assets(garden_id: str, user_id: CurrentUser) -> WorldAssetsResponse:
    """Display assets for the garden's generated Marble world.

    The frontend loads the splat scene straight from the World Labs CDN
    (which allows cross-origin GETs), so this only returns URLs + metadata.
    """
    _fetch_owned_garden(garden_id, user_id)
    row = _latest_generation(garden_id)
    if not row or not row.get("world_id"):
        raise not_found("No generated world for this garden")

    assets = await world_labs.fetch_assets(row["world_id"])
    spz_urls: dict = assets.get("spz_urls") or {}
    splat_url = next(
        (spz_urls[q] for q in _SPLAT_QUALITY_ORDER if spz_urls.get(q)),
        next(iter(spz_urls.values()), None),
    )
    return WorldAssetsResponse(
        world_id=row["world_id"],
        splat_url=splat_url,
        spz_urls=spz_urls,
        metric_scale_factor=assets.get("metric_scale_factor"),
        ground_plane_offset=assets.get("ground_plane_offset"),
    )


@router.get("/{garden_id}/world/pano")
async def world_pano(garden_id: str, user_id: CurrentUser) -> Response:
    """Proxy the generated world's panorama image (same-origin, avoids CORS).

    The frontend renders these bytes as an equirectangular texture so users can
    look around their own garden without embedding the (un-embeddable) Marble page.
    """
    _fetch_owned_garden(garden_id, user_id)
    row = _latest_generation(garden_id)
    if not row or not row.get("world_id"):
        raise not_found("No generated world panorama for this garden")

    content, content_type = await world_labs.fetch_pano(row["world_id"])
    return Response(
        content=content,
        media_type=content_type,
        headers={"Cache-Control": "private, max-age=3600"},
    )
