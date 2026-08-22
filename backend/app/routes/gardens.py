from fastapi import APIRouter, Response

from ..auth import CurrentUser
from ..errors import not_found, validation_error
from ..models.schemas import (
    Garden,
    GardenCreate,
    GardenUpdate,
    ObstaclesReplace,
)
from ..supabase_client import get_supabase

router = APIRouter(prefix="/api/gardens", tags=["gardens"])


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


@router.post("", response_model=Garden)
async def create_garden(body: GardenCreate, user_id: CurrentUser) -> Garden:
    if body.width_m <= 0 or body.length_m <= 0:
        raise validation_error("Width and length must be positive.")
    sb = get_supabase()
    payload = body.model_dump(exclude_none=True)
    payload["user_id"] = user_id
    res = sb.table("gardens").insert(payload).execute()
    return Garden(**res.data[0])


@router.get("", response_model=list[Garden])
async def list_gardens(user_id: CurrentUser) -> list[Garden]:
    sb = get_supabase()
    res = (
        sb.table("gardens")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [Garden(**row) for row in res.data]


@router.get("/{garden_id}", response_model=Garden)
async def get_garden(garden_id: str, user_id: CurrentUser) -> Garden:
    return Garden(**_fetch_owned_garden(garden_id, user_id))


@router.patch("/{garden_id}", response_model=Garden)
async def update_garden(
    garden_id: str, body: GardenUpdate, user_id: CurrentUser
) -> Garden:
    _fetch_owned_garden(garden_id, user_id)
    updates = body.model_dump(exclude_none=True)
    sb = get_supabase()
    if not updates:
        return Garden(**_fetch_owned_garden(garden_id, user_id))
    res = (
        sb.table("gardens")
        .update(updates)
        .eq("id", garden_id)
        .eq("user_id", user_id)
        .execute()
    )
    return Garden(**res.data[0])


@router.delete("/{garden_id}", status_code=204)
async def delete_garden(garden_id: str, user_id: CurrentUser) -> Response:
    """Delete a garden. Plans, obstacles, preferences, and world generations
    cascade at the database level; notifications keep their history."""
    _fetch_owned_garden(garden_id, user_id)
    sb = get_supabase()
    sb.table("gardens").delete().eq("id", garden_id).eq("user_id", user_id).execute()
    return Response(status_code=204)


@router.post("/{garden_id}/obstacles")
async def replace_obstacles(
    garden_id: str, body: ObstaclesReplace, user_id: CurrentUser
) -> dict:
    _fetch_owned_garden(garden_id, user_id)
    sb = get_supabase()
    sb.table("garden_obstacles").delete().eq("garden_id", garden_id).execute()
    if body.obstacles:
        rows = [
            {"garden_id": garden_id, **ob.model_dump()} for ob in body.obstacles
        ]
        sb.table("garden_obstacles").insert(rows).execute()
    return {"obstacles": [ob.model_dump() for ob in body.obstacles]}
