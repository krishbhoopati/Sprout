"""World Labs 3D generation with a mock path (IMPLEMENTATION.md §18).

The mock returns a ready world after being polled twice, simulating a short
generation delay without any external dependency. Keep MOCK_WORLD_LABS=true for
a reliable demo.
"""

from __future__ import annotations

import uuid

import httpx

from ..config import settings
from ..errors import upstream_unavailable

# A prepared demo world used as the fallback / mock result.
DEMO_WORLD_URL = "https://www.worldlabs.ai/"


def is_mock() -> bool:
    return settings.mock_world_labs or not settings.world_labs_api_key


async def start_generation(image_signed_url: str) -> tuple[str, str]:
    """Kick off a generation. Returns (operation_id, status)."""
    if is_mock():
        return str(uuid.uuid4()), "processing"

    url = f"{settings.world_labs_base_url}/v1/generations"
    headers = {"Authorization": f"Bearer {settings.world_labs_api_key}"}
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                url, headers=headers, json={"image_url": image_signed_url}
            )
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise upstream_unavailable(f"World Labs unavailable: {exc}") from exc
    return data.get("operation_id", str(uuid.uuid4())), data.get(
        "status", "processing"
    )


async def check_status(operation_id: str) -> tuple[str, str | None, str | None]:
    """Poll a generation. Returns (status, result_url, error_message)."""
    if is_mock():
        # Mock is resolved by the route using the stored poll count.
        return "ready", DEMO_WORLD_URL, None

    url = f"{settings.world_labs_base_url}/v1/generations/{operation_id}"
    headers = {"Authorization": f"Bearer {settings.world_labs_api_key}"}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise upstream_unavailable(f"World Labs unavailable: {exc}") from exc
    return (
        data.get("status", "processing"),
        data.get("result_url"),
        data.get("error_message"),
    )
