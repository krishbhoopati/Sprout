from fastapi import APIRouter

from ..auth import CurrentUser
from ..crops_repo import all_relationships, crop_input, crops_by_id
from ..errors import not_found, validation_error
from ..models.schemas import (
    GeneratePlanRequest,
    PlanResponse,
    PlantingPlan,
    PlotAssignment,
    UnplacedCrop,
)
from ..services.optimizer import ObstacleRect, Optimizer
from ..supabase_client import get_supabase

router = APIRouter(prefix="/api", tags=["plans"])


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


@router.post("/gardens/{garden_id}/plans/generate", response_model=PlanResponse)
async def generate_plan(
    garden_id: str, body: GeneratePlanRequest, user_id: CurrentUser
) -> PlanResponse:
    garden = _fetch_owned_garden(garden_id, user_id)

    known = crops_by_id()
    crop_inputs = []
    for sel in body.selections:
        crop = known.get(sel.crop_id)
        if crop is None:
            raise validation_error(f"Unknown crop: {sel.crop_id}")
        crop_inputs.append(crop_input(crop, sel.priority))
    if not crop_inputs:
        raise validation_error("Select at least one crop.")

    sb = get_supabase()
    obstacle_rows = (
        sb.table("garden_obstacles").select("*").eq("garden_id", garden_id).execute()
    )
    obstacles = [
        ObstacleRect(
            x=o["x"], y=o["y"], width_cells=o["width_cells"], height_cells=o["height_cells"]
        )
        for o in obstacle_rows.data
    ]

    result = Optimizer(
        width_m=garden["width_m"],
        length_m=garden["length_m"],
        sunlight_level=garden["sunlight_level"],
        crops=crop_inputs,
        relationships=all_relationships(),
        obstacles=obstacles,
        cell_cm=body.grid_cell_cm,
    ).run()

    # Plan-level totals.
    prices = {cid: known[cid].estimated_price_per_kg for cid in known}
    min_yield = sum(a.estimated_minimum_yield_kg for a in result.assignments)
    max_yield = sum(a.estimated_maximum_yield_kg for a in result.assignments)
    min_savings = sum(
        a.estimated_minimum_yield_kg * prices[a.crop_id] for a in result.assignments
    )
    max_savings = sum(
        a.estimated_maximum_yield_kg * prices[a.crop_id] for a in result.assignments
    )

    plan_row = (
        sb.table("planting_plans")
        .insert(
            {
                "garden_id": garden_id,
                "status": "complete",
                "estimated_minimum_yield_kg": round(min_yield, 2),
                "estimated_maximum_yield_kg": round(max_yield, 2),
                "estimated_minimum_savings": round(min_savings, 2),
                "estimated_maximum_savings": round(max_savings, 2),
                "space_utilization": result.space_utilization,
            }
        )
        .execute()
    ).data[0]
    plan_id = plan_row["id"]

    # Insert assignments (two-pass so successor self-FKs resolve to DB ids).
    temp_to_db: dict[str, str] = {}
    for a in result.assignments:
        row = (
            sb.table("plot_assignments")
            .insert(
                {
                    "plan_id": plan_id,
                    "crop_id": a.crop_id,
                    "x": a.x,
                    "y": a.y,
                    "width_cells": a.width_cells,
                    "height_cells": a.height_cells,
                    "plant_date": a.plant_date.isoformat(),
                    "harvest_start": a.harvest_start.isoformat(),
                    "harvest_end": a.harvest_end.isoformat(),
                    "plant_count": a.plant_count,
                    "estimated_minimum_yield_kg": a.estimated_minimum_yield_kg,
                    "estimated_maximum_yield_kg": a.estimated_maximum_yield_kg,
                    "explanation": a.explanation,
                }
            )
            .execute()
        ).data[0]
        temp_to_db[a.id] = row["id"]

    for a in result.assignments:
        if a.successor_assignment_id:
            sb.table("plot_assignments").update(
                {"successor_assignment_id": temp_to_db[a.successor_assignment_id]}
            ).eq("id", temp_to_db[a.id]).execute()

    plan = PlantingPlan(**plan_row)
    assignments = [
        PlotAssignment(
            id=temp_to_db[a.id],
            crop_id=a.crop_id,
            crop=a.crop,
            x=a.x,
            y=a.y,
            width_cells=a.width_cells,
            height_cells=a.height_cells,
            plant_date=a.plant_date,
            harvest_start=a.harvest_start,
            harvest_end=a.harvest_end,
            removal_date=a.removal_date,
            plant_count=a.plant_count,
            estimated_minimum_yield_kg=a.estimated_minimum_yield_kg,
            estimated_maximum_yield_kg=a.estimated_maximum_yield_kg,
            successor_assignment_id=(
                temp_to_db[a.successor_assignment_id]
                if a.successor_assignment_id
                else None
            ),
            explanation=a.explanation,
        )
        for a in result.assignments
    ]
    unplaced = [UnplacedCrop(crop_id=u.crop_id, reason=u.reason) for u in result.unplaced]

    return PlanResponse(plan=plan, assignments=assignments, unplaced=unplaced)


@router.get("/plans/{plan_id}", response_model=PlanResponse)
async def get_plan(plan_id: str, user_id: CurrentUser) -> PlanResponse:
    sb = get_supabase()
    plan_res = sb.table("planting_plans").select("*").eq("id", plan_id).limit(1).execute()
    if not plan_res.data:
        raise not_found("Plan not found")
    plan_row = plan_res.data[0]

    # ownership through the garden
    _fetch_owned_garden(plan_row["garden_id"], user_id)

    rows = (
        sb.table("plot_assignments").select("*").eq("plan_id", plan_id).execute()
    ).data
    names = {cid: c.name for cid, c in crops_by_id().items()}

    assignments = [
        PlotAssignment(
            id=r["id"],
            crop_id=r["crop_id"],
            crop=names.get(r["crop_id"], r["crop_id"]),
            x=r["x"],
            y=r["y"],
            width_cells=r["width_cells"],
            height_cells=r["height_cells"],
            plant_date=r["plant_date"],
            harvest_start=r["harvest_start"],
            harvest_end=r["harvest_end"],
            removal_date=r.get("harvest_end"),
            plant_count=r["plant_count"],
            estimated_minimum_yield_kg=r["estimated_minimum_yield_kg"],
            estimated_maximum_yield_kg=r["estimated_maximum_yield_kg"],
            successor_assignment_id=r.get("successor_assignment_id"),
            explanation=r.get("explanation", ""),
        )
        for r in rows
    ]
    return PlanResponse(plan=PlantingPlan(**plan_row), assignments=assignments)
