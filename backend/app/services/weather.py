"""Open-Meteo weather fetch with a mock path (IMPLEMENTATION.md §21)."""

from __future__ import annotations

from datetime import date, timedelta

import httpx

from ..config import settings
from ..errors import upstream_unavailable
from ..models.schemas import WeatherCurrent, WeatherDaily, WeatherResponse


def _mock_weather() -> WeatherResponse:
    today = date.today()
    daily = [
        WeatherDaily(
            date=today + timedelta(days=i),
            temperature_min_c=11.0 + i,
            temperature_max_c=21.0 + i,
            precipitation_mm=0.0 if i % 3 else 4.5,
        )
        for i in range(7)
    ]
    return WeatherResponse(
        current=WeatherCurrent(
            temperature_c=19.0, precipitation_mm=0.0, description="Clear (mock)"
        ),
        daily=daily,
    )


async def get_weather(latitude: float, longitude: float) -> WeatherResponse:
    if settings.mock_weather:
        return _mock_weather()

    url = f"{settings.open_meteo_base_url}/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,precipitation",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
        "forecast_days": 7,
        "timezone": "auto",
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise upstream_unavailable(f"Weather service unavailable: {exc}") from exc

    current = data.get("current", {})
    daily_data = data.get("daily", {})
    times = daily_data.get("time", [])
    daily = [
        WeatherDaily(
            date=date.fromisoformat(times[i]),
            temperature_min_c=daily_data["temperature_2m_min"][i],
            temperature_max_c=daily_data["temperature_2m_max"][i],
            precipitation_mm=daily_data["precipitation_sum"][i],
        )
        for i in range(len(times))
    ]
    return WeatherResponse(
        current=WeatherCurrent(
            temperature_c=current.get("temperature_2m", 0.0),
            precipitation_mm=current.get("precipitation", 0.0),
        ),
        daily=daily,
    )
