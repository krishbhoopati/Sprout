// Shared contract types for Sprout. These mirror the backend pydantic models and
// the plan/assignment JSON shape agreed at CP0 (see IMPLEMENTATION.md sections 9, 12).
// If the plan/assignment shape changes, update this file in the same commit.

export type SunlightLevel = "full_sun" | "partial_sun" | "shade";

export type SunlightRequirement = "full_sun" | "partial_sun" | "shade";

export type CropPriority = "must_have" | "preferred" | "optional";

export type RelationshipType = "companion" | "conflict";

export type PlanStatus = "pending" | "processing" | "complete" | "failed";

export type WorldStatus = "pending" | "processing" | "ready" | "failed";

export interface Profile {
  id: string;
  display_name: string | null;
  city: string | null;
  created_at: string;
}

export interface Garden {
  id: string;
  user_id: string;
  name: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  width_m: number;
  length_m: number;
  sunlight_level: SunlightLevel;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface GardenObstacle {
  id?: string;
  garden_id?: string;
  x: number;
  y: number;
  width_cells: number;
  height_cells: number;
}

export interface Crop {
  id: string;
  name: string;
  spacing_cm: number;
  days_to_maturity: number;
  harvest_duration_days: number;
  sunlight_requirement: SunlightRequirement;
  height_cm: number;
  minimum_yield_kg: number;
  maximum_yield_kg: number;
  estimated_price_per_kg: number;
  planting_month_start: number;
  planting_month_end: number;
  difficulty: string;
}

export interface CropSelection {
  crop_id: string;
  priority: CropPriority;
}

export interface PlantingPlan {
  id: string;
  garden_id: string;
  status: PlanStatus;
  estimated_minimum_yield_kg: number;
  estimated_maximum_yield_kg: number;
  estimated_minimum_savings: number;
  estimated_maximum_savings: number;
  space_utilization: number;
  created_at?: string;
}

export interface PlotAssignment {
  id: string;
  crop_id: string;
  crop: string;
  x: number;
  y: number;
  width_cells: number;
  height_cells: number;
  plant_date: string;
  harvest_start: string;
  harvest_end: string;
  removal_date?: string;
  plant_count: number;
  estimated_minimum_yield_kg: number;
  estimated_maximum_yield_kg: number;
  successor_assignment_id: string | null;
  explanation: string;
}

export interface UnplacedCrop {
  crop_id: string;
  reason: string;
}

export interface PlanResponse {
  plan: PlantingPlan;
  assignments: PlotAssignment[];
  unplaced?: UnplacedCrop[];
}

export interface Notification {
  id: string;
  user_id: string;
  garden_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface WeatherCurrent {
  temperature_c: number;
  precipitation_mm: number;
  description?: string;
}

export interface WeatherDaily {
  date: string;
  temperature_min_c: number;
  temperature_max_c: number;
  precipitation_mm: number;
}

export interface WeatherResponse {
  current: WeatherCurrent;
  daily: WeatherDaily[];
}

export interface WorldGenerationStatus {
  status: WorldStatus;
  result_url?: string;
  error_message?: string;
  world_id?: string;
}
