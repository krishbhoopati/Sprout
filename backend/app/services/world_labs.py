"""World Labs (Marble) 3D world generation with a reliable mock path (§18).

Real path uses the World Labs **World API** (Marble):
- POST  /marble/v1/worlds:generate            → start a generation (Operation)
- GET   /marble/v1/operations/{operation_id}  → poll until done
- GET   /marble/v1/worlds/{world_id}          → fetch the world + its assets

Marble worlds are Gaussian-splat scenes; the API also returns an equirectangular
panorama (`assets.imagery.pano_url`) which we render in-app, plus a hosted
explorable viewer at `world_marble_url` (opened in a new tab — that page sends
`X-Frame-Options: DENY`, so it cannot be embedded in an iframe).

When MOCK_WORLD_LABS=true we skip the network and simulate a generation that
completes with no world (the app renders only real World Labs output).
"""

from __future__ import annotations

import uuid

import httpx

from ..config import settings
from ..errors import upstream_unavailable

_API_KEY_HEADER = "WLT-Api-Key"


def is_mock() -> bool:
    return settings.mock_world_labs or not settings.world_labs_api_key


def _headers() -> dict[str, str]:
    return {
        _API_KEY_HEADER: settings.world_labs_api_key,
        "Content-Type": "application/json",
    }


def marble_world_url(world_id: str) -> str:
    return f"https://marble.worldlabs.ai/world/{world_id}"


async def _upload_media_asset(
    client: httpx.AsyncClient, image_bytes: bytes, extension: str
) -> str:
    """Upload local image bytes as a Marble media asset. Returns media_asset_id."""
    ext = (extension or "jpg").lstrip(".").lower()
    prep = await client.post(
        f"{settings.world_labs_base_url}/marble/v1/media-assets:prepare_upload",
        headers=_headers(),
        json={"file_name": f"garden.{ext}", "kind": "image", "extension": ext},
    )
    prep.raise_for_status()
    prep_data = prep.json()
    asset = prep_data["media_asset"]
    # The live API names this field media_asset_id; tolerate id too.
    media_asset_id = asset.get("media_asset_id") or asset["id"]
    upload_info = prep_data["upload_info"]

    put = await client.request(
        upload_info.get("upload_method", "PUT"),
        upload_info["upload_url"],
        headers=upload_info.get("required_headers", {}),
        content=image_bytes,
    )
    put.raise_for_status()
    return media_asset_id


async def start_generation(
    image_bytes: bytes | None,
    extension: str,
    text_prompt: str,
) -> tuple[str, str]:
    """Kick off a generation. Returns (operation_id, status)."""
    if is_mock():
        return str(uuid.uuid4()), "processing"

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            if image_bytes:
                media_asset_id = await _upload_media_asset(
                    client, image_bytes, extension
                )
                world_prompt = {
                    "type": "image",
                    "image_prompt": {
                        "source": "media_asset",
                        "media_asset_id": media_asset_id,
                    },
                    "text_prompt": text_prompt,
                }
            else:
                world_prompt = {"type": "text", "text_prompt": text_prompt}

            resp = await client.post(
                f"{settings.world_labs_base_url}/marble/v1/worlds:generate",
                headers=_headers(),
                json={
                    "display_name": "Sprout garden",
                    "model": settings.world_labs_model,
                    "world_prompt": world_prompt,
                },
            )
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        raise upstream_unavailable(f"World Labs unavailable: {exc}") from exc

    return data.get("operation_id", str(uuid.uuid4())), "processing"


async def check_status(
    operation_id: str,
) -> tuple[str, str | None, str | None, str | None]:
    """Poll a generation. Returns (status, world_id, result_url, error_message)."""
    if is_mock():
        return "ready", None, None, None

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{settings.world_labs_base_url}/marble/v1/operations/{operation_id}",
                headers=_headers(),
            )
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise upstream_unavailable(f"World Labs unavailable: {exc}") from exc

    error = data.get("error")
    metadata = data.get("metadata") or {}
    response = data.get("response") or {}
    world_id = metadata.get("world_id") or response.get("id")

    if error:
        message = error.get("message") if isinstance(error, dict) else str(error)
        return "failed", world_id, None, message
    if not data.get("done"):
        return "processing", world_id, None, None

    result_url = response.get("world_marble_url")
    if not result_url and world_id:
        result_url = marble_world_url(world_id)
    return "ready", world_id, result_url, None


def parse_world_assets(data: dict) -> dict:
    """Extract display assets from a GET /marble/v1/worlds/{id} response.

    The live API returns the world object at the top level; tolerate an older
    ``{"world": {...}}`` wrapper too.
    """
    world = data.get("world") if isinstance(data.get("world"), dict) else data
    assets = world.get("assets") or {}
    splats = assets.get("splats") or {}
    metadata = splats.get("semantics_metadata") or {}
    return {
        "pano_url": (assets.get("imagery") or {}).get("pano_url"),
        "spz_urls": splats.get("spz_urls") or {},
        "metric_scale_factor": metadata.get("metric_scale_factor"),
        "ground_plane_offset": metadata.get("ground_plane_offset"),
    }


async def fetch_assets(world_id: str) -> dict:
    """Fetch the world's display assets (splat URLs, pano URL, render metadata)."""
    if is_mock() or not world_id:
        raise upstream_unavailable("No assets available for this world.")

    try:
        async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
            resp = await client.get(
                f"{settings.world_labs_base_url}/marble/v1/worlds/{world_id}",
                headers=_headers(),
            )
            resp.raise_for_status()
            return parse_world_assets(resp.json())
    except (httpx.HTTPError, ValueError) as exc:
        raise upstream_unavailable(f"World Labs unavailable: {exc}") from exc


async def fetch_pano(world_id: str) -> tuple[bytes, str]:
    """Fetch the world's equirectangular panorama. Returns (bytes, content_type).

    Resolved fresh from the world each call in case asset URLs rotate.
    """
    assets = await fetch_assets(world_id)
    pano_url = assets.get("pano_url")
    if not pano_url:
        raise upstream_unavailable("World has no panorama yet.")

    try:
        async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
            img = await client.get(pano_url)
            img.raise_for_status()
    except (httpx.HTTPError, ValueError) as exc:
        raise upstream_unavailable(f"World Labs panorama unavailable: {exc}") from exc

    content_type = img.headers.get("content-type", "image/jpeg")
    return img.content, content_type
