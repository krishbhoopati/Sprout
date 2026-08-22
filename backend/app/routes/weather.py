from fastapi import APIRouter

from ..auth import CurrentUser
from ..errors import not_found
from ..models.schemas import WeatherResponse
from ..services.weather import get_weather
from ..supabase_client import get_supabase

router = APIRouter(prefix="/api/gardens", tags=["weather"])


@router.get("/{garden_id}/weather", response_model=WeatherResponse)
async def garden_weather(garden_id: str, user_id: CurrentUser) -> WeatherResponse:
    sb = get_supabase()
    res = (
        sb.table("gardens")
        .select("latitude,longitude")
        .eq("id", garden_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise not_found("Garden not found")
    row = res.data[0]
    # Fall back to a sensible default location when the garden has no coordinates.
    latitude = row.get("latitude") or 45.52
    longitude = row.get("longitude") or -122.68
    return await get_weather(latitude, longitude)
