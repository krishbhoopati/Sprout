from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

SunlightLevel = Literal["full_sun", "partial_sun", "shade"]
CropPriority = Literal["must_have", "preferred", "optional"]
RelationshipType = Literal["companion", "conflict"]
PlanStatus = Literal["pending", "processing", "complete", "failed"]
WorldStatus = Literal["pending", "processing", "ready", "failed"]


# ---- Gardens ----
class GardenCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    city: Optional[str] = None
    width_m: float = Field(gt=0, le=100)
    length_m: float = Field(gt=0, le=100)
    sunlight_level: SunlightLevel
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)


class GardenUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    city: Optional[str] = None
    width_m: Optional[float] = Field(default=None, gt=0, le=100)
    length_m: Optional[float] = Field(default=None, gt=0, le=100)
    sunlight_level: Optional[SunlightLevel] = None
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    image_path: Optional[str] = None


class Garden(BaseModel):
    id: str
    user_id: str
    name: str
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    width_m: float
    length_m: float
    sunlight_level: SunlightLevel
    image_path: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Obstacle(BaseModel):
    x: int = Field(ge=0)
    y: int = Field(ge=0)
    width_cells: int = Field(gt=0)
    height_cells: int = Field(gt=0)


class ObstaclesReplace(BaseModel):
    obstacles: list[Obstacle] = []


# ---- Crops ----
class Crop(BaseModel):
    id: str
    name: str
    spacing_cm: float
    days_to_maturity: int
    harvest_duration_days: int
    sunlight_requirement: SunlightLevel
    height_cm: float
    minimum_yield_kg: float
    maximum_yield_kg: float
    estimated_price_per_kg: float
    planting_month_start: int
    planting_month_end: int
    difficulty: str


# ---- Plans ----
class CropSelection(BaseModel):
    crop_id: str
    priority: CropPriority = "preferred"


class GeneratePlanRequest(BaseModel):
    selections: list[CropSelection] = Field(min_length=1)
    grid_cell_cm: int = Field(default=30, ge=10, le=100)


class PlantingPlan(BaseModel):
    id: str
    garden_id: str
    status: PlanStatus
    estimated_minimum_yield_kg: float
    estimated_maximum_yield_kg: float
    estimated_minimum_savings: float
    estimated_maximum_savings: float
    space_utilization: float
    created_at: Optional[datetime] = None


class PlotAssignment(BaseModel):
    id: str
    crop_id: str
    crop: str
    x: int
    y: int
    width_cells: int
    height_cells: int
    plant_date: date
    harvest_start: date
    harvest_end: date
    removal_date: Optional[date] = None
    plant_count: int
    estimated_minimum_yield_kg: float
    estimated_maximum_yield_kg: float
    successor_assignment_id: Optional[str] = None
    explanation: str


class UnplacedCrop(BaseModel):
    crop_id: str
    reason: str


class PlanResponse(BaseModel):
    plan: PlantingPlan
    assignments: list[PlotAssignment]
    unplaced: list[UnplacedCrop] = []


# ---- Weather ----
class WeatherCurrent(BaseModel):
    temperature_c: float
    precipitation_mm: float
    description: Optional[str] = None


class WeatherDaily(BaseModel):
    date: date
    temperature_min_c: float
    temperature_max_c: float
    precipitation_mm: float


class WeatherResponse(BaseModel):
    current: WeatherCurrent
    daily: list[WeatherDaily]


# ---- World Labs ----
class WorldStartRequest(BaseModel):
    # Crop names from the plan, used to steer the World Labs prompt so the
    # generated world features the vegetables the user actually planned.
    crops: list[str] = []


class WorldStartResponse(BaseModel):
    operation_id: str
    status: WorldStatus


class WorldStatusResponse(BaseModel):
    status: WorldStatus
    result_url: Optional[str] = None
    error_message: Optional[str] = None
    # Present for real Marble worlds; the frontend uses it to render the
    # in-app panorama and build the "Open in Marble" link.
    world_id: Optional[str] = None


class WorldAssetsResponse(BaseModel):
    world_id: str
    # Direct CDN URL of the Gaussian-splat scene the in-app viewer renders
    # (the CDN allows cross-origin GETs, so no proxying is needed).
    splat_url: Optional[str] = None
    # All available splat quality levels, keyed by name (e.g. "100k", "500k").
    spz_urls: dict[str, str] = {}
    # Marble semantics metadata for rendering at real-world scale.
    metric_scale_factor: Optional[float] = None
    ground_plane_offset: Optional[float] = None


# ---- Marketplace ----
ExchangeType = Literal["sell", "trade", "free"]
ListingStatus = Literal["draft", "published", "reserved", "completed", "archived"]


class MarketplaceListingCreate(BaseModel):
    # crop_id links to the curated crops table; omit it and set title for "other".
    crop_id: Optional[str] = None
    title: str = Field(min_length=1, max_length=120)
    exchange_type: ExchangeType
    price_per_unit: Optional[float] = Field(default=None, ge=0)
    quantity: Optional[float] = Field(default=None, ge=0)
    unit: Optional[str] = Field(default=None, max_length=20)
    city: Optional[str] = None
    description: Optional[str] = Field(default=None, max_length=1000)


class MarketplaceListingUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=120)
    exchange_type: Optional[ExchangeType] = None
    price_per_unit: Optional[float] = Field(default=None, ge=0)
    quantity: Optional[float] = Field(default=None, ge=0)
    unit: Optional[str] = Field(default=None, max_length=20)
    city: Optional[str] = None
    description: Optional[str] = Field(default=None, max_length=1000)
    status: Optional[ListingStatus] = None


class MarketplaceListing(BaseModel):
    id: str
    crop_id: Optional[str] = None
    crop_name: Optional[str] = None
    title: str
    exchange_type: Optional[ExchangeType] = None
    price_per_unit: Optional[float] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    city: Optional[str] = None
    description: Optional[str] = None
    status: ListingStatus
    seller_name: Optional[str] = None
    seller_city: Optional[str] = None
    # Name of the buyer who reserved this listing (shown to the seller under "mine").
    reserved_by_name: Optional[str] = None
    is_mine: bool = False
    is_reserved_by_me: bool = False
    created_at: Optional[datetime] = None


# ---- Notifications (webhook) ----
class N8nNotification(BaseModel):
    user_id: str
    garden_id: Optional[str] = None
    type: str
    title: str
    message: str
