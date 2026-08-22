"""Loads the curated crop dataset from JSON. Used by /api/crops and the optimizer."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from .models.schemas import Crop
from .services.optimizer import CropInput, Relationship

_DATA_PATH = Path(__file__).parent / "data" / "crop_seed_data.json"


@lru_cache
def _raw() -> dict:
    with _DATA_PATH.open(encoding="utf-8") as f:
        return json.load(f)


@lru_cache
def all_crops() -> list[Crop]:
    return [Crop(**c) for c in _raw()["crops"]]


@lru_cache
def crops_by_id() -> dict[str, Crop]:
    return {c.id: c for c in all_crops()}


def get_crop(crop_id: str) -> Crop | None:
    return crops_by_id().get(crop_id)


@lru_cache
def all_relationships() -> list[Relationship]:
    return [Relationship(**r) for r in _raw().get("relationships", [])]


def crop_input(crop: Crop, priority: str) -> CropInput:
    return CropInput(
        id=crop.id,
        name=crop.name,
        spacing_cm=crop.spacing_cm,
        days_to_maturity=crop.days_to_maturity,
        harvest_duration_days=crop.harvest_duration_days,
        sunlight_requirement=crop.sunlight_requirement,
        height_cm=crop.height_cm,
        minimum_yield_kg=crop.minimum_yield_kg,
        maximum_yield_kg=crop.maximum_yield_kg,
        estimated_price_per_kg=crop.estimated_price_per_kg,
        planting_month_start=crop.planting_month_start,
        planting_month_end=crop.planting_month_end,
        difficulty=crop.difficulty,
        priority=priority,
    )
