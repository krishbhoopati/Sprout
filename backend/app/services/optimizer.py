"""Two-stage space-and-time planting optimizer (IMPLEMENTATION.md §13-14).

Pure Python: no database or network access, so it is fast to run inside one
request and straightforward to unit test. The route layer adapts DB rows into
the dataclasses below and persists the returned assignments.
"""

from __future__ import annotations

import calendar
import math
from dataclasses import dataclass, field
from datetime import date, timedelta

from . import estimates

# Sunlight ranks: a crop grows if the garden provides at least its requirement.
_LIGHT_RANK = {"shade": 0, "partial_sun": 1, "full_sun": 2}

# Scoring weights (tune on the demo garden).
W_YIELD = 0.30
W_PREF = 0.25
W_COMPAT = 0.15
W_UTIL = 0.15
W_SPREAD = 0.10
W_SHADE = 0.05

_PRIORITY_WEIGHT = {"must_have": 1.0, "preferred": 0.6, "optional": 0.3}


@dataclass
class CropInput:
    id: str
    name: str
    spacing_cm: float
    days_to_maturity: int
    harvest_duration_days: int
    sunlight_requirement: str
    height_cm: float
    minimum_yield_kg: float
    maximum_yield_kg: float
    estimated_price_per_kg: float
    planting_month_start: int
    planting_month_end: int
    difficulty: str = "easy"
    priority: str = "preferred"


@dataclass
class Relationship:
    crop_id: str
    related_crop_id: str
    relationship_type: str  # "companion" | "conflict"
    score: float


@dataclass
class ObstacleRect:
    x: int
    y: int
    width_cells: int
    height_cells: int


@dataclass
class Assignment:
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
    removal_date: date
    plant_count: int
    estimated_minimum_yield_kg: float
    estimated_maximum_yield_kg: float
    successor_assignment_id: str | None = None
    explanation: str = ""


@dataclass
class Unplaced:
    crop_id: str
    reason: str


@dataclass
class OptimizerResult:
    assignments: list[Assignment] = field(default_factory=list)
    unplaced: list[Unplaced] = field(default_factory=list)
    space_utilization: float = 0.0


# --------------------------------------------------------------------------- #
# Date / season helpers
# --------------------------------------------------------------------------- #
def default_season(reference: date | None = None) -> tuple[date, date]:
    """A growing season (Mar 1 - Oct 31). Rolls to next year if we're past it."""
    ref = reference or date.today()
    year = ref.year if ref.month <= 8 else ref.year + 1
    return date(year, 3, 1), date(year, 10, 31)


def _month_last_day(year: int, month: int) -> date:
    return date(year, month, calendar.monthrange(year, month)[1])


def dates_overlap(a_start: date, a_end: date, b_start: date, b_end: date) -> bool:
    return a_start <= b_end and b_start <= a_end


def rects_overlap(
    ax: int, ay: int, aw: int, ah: int, bx: int, by: int, bw: int, bh: int
) -> bool:
    return not (ax + aw <= bx or bx + bw <= ax or ay + ah <= by or by + bh <= ay)


# --------------------------------------------------------------------------- #
# Grid
# --------------------------------------------------------------------------- #
class Grid:
    """A rows x cols grid; each cell holds occupied [start, end] date intervals."""

    def __init__(self, rows: int, cols: int):
        self.rows = rows
        self.cols = cols
        self.cells: list[list[list[tuple[date, date]]]] = [
            [[] for _ in range(cols)] for _ in range(rows)
        ]

    def in_bounds(self, x: int, y: int, w: int, h: int) -> bool:
        return x >= 0 and y >= 0 and x + w <= self.cols and y + h <= self.rows

    def region_free(
        self, x: int, y: int, w: int, h: int, start: date, end: date
    ) -> bool:
        if not self.in_bounds(x, y, w, h):
            return False
        for r in range(y, y + h):
            for c in range(x, x + w):
                for (s, e) in self.cells[r][c]:
                    if dates_overlap(start, end, s, e):
                        return False
        return True

    def reserve(self, x: int, y: int, w: int, h: int, start: date, end: date) -> None:
        for r in range(y, y + h):
            for c in range(x, x + w):
                self.cells[r][c].append((start, end))

    def find_free_region(
        self, w: int, h: int, start: date, end: date
    ) -> tuple[int, int] | None:
        for y in range(0, self.rows - h + 1):
            for x in range(0, self.cols - w + 1):
                if self.region_free(x, y, w, h, start, end):
                    return x, y
        return None


# --------------------------------------------------------------------------- #
# Optimizer
# --------------------------------------------------------------------------- #
class Optimizer:
    def __init__(
        self,
        width_m: float,
        length_m: float,
        sunlight_level: str,
        crops: list[CropInput],
        relationships: list[Relationship] | None = None,
        obstacles: list[ObstacleRect] | None = None,
        cell_cm: int = 30,
        season: tuple[date, date] | None = None,
    ):
        self.cell_cm = cell_cm
        self.cols = math.floor(width_m * 100 / cell_cm)
        self.rows = math.floor(length_m * 100 / cell_cm)
        self.sunlight_level = sunlight_level
        self.crops = crops
        self.obstacles = obstacles or []
        self.season_start, self.season_end = season or default_season()

        # symmetric relationship lookup
        self.rel: dict[tuple[str, str], Relationship] = {}
        for rel in relationships or []:
            self.rel[(rel.crop_id, rel.related_crop_id)] = rel
            self.rel[(rel.related_crop_id, rel.crop_id)] = rel

        self.grid = Grid(self.rows, self.cols)
        for ob in self.obstacles:
            if self.grid.in_bounds(ob.x, ob.y, ob.width_cells, ob.height_cells):
                self.grid.reserve(
                    ob.x,
                    ob.y,
                    ob.width_cells,
                    ob.height_cells,
                    self.season_start,
                    self.season_end,
                )

        self._counter = 0
        self.assignments: list[Assignment] = []
        self.unplaced: list[Unplaced] = []

    # -- helpers ----------------------------------------------------------- #
    def _next_id(self) -> str:
        self._counter += 1
        return f"a{self._counter}"

    def _block_side(self, crop: CropInput) -> int:
        return max(1, math.ceil(crop.spacing_cm / self.cell_cm))

    def _light_ok(self, crop: CropInput) -> bool:
        return _LIGHT_RANK[self.sunlight_level] >= _LIGHT_RANK[crop.sunlight_requirement]

    def _earliest_plant_date(
        self, crop: CropInput, not_before: date
    ) -> date | None:
        """Earliest valid plant date honoring window, season, and maturity."""
        year = self.season_start.year
        window_start = date(year, crop.planting_month_start, 1)
        window_end = _month_last_day(year, crop.planting_month_end)
        candidate = max(not_before, self.season_start, window_start)
        if candidate > window_end or candidate > self.season_end:
            return None
        harvest_end = candidate + timedelta(
            days=crop.days_to_maturity + crop.harvest_duration_days
        )
        if harvest_end > self.season_end:
            return None
        return candidate

    def _make_assignment(
        self, crop: CropInput, x: int, y: int, side: int, plant_date: date
    ) -> Assignment:
        harvest_start = plant_date + timedelta(days=crop.days_to_maturity)
        harvest_end = harvest_start + timedelta(days=crop.harvest_duration_days)
        count = estimates.plant_count(side, side, crop.spacing_cm, self.cell_cm)
        yr = estimates.yield_range(count, crop.minimum_yield_kg, crop.maximum_yield_kg)
        return Assignment(
            id=self._next_id(),
            crop_id=crop.id,
            crop=crop.name,
            x=x,
            y=y,
            width_cells=side,
            height_cells=side,
            plant_date=plant_date,
            harvest_start=harvest_start,
            harvest_end=harvest_end,
            removal_date=harvest_end,
            plant_count=count,
            estimated_minimum_yield_kg=yr.minimum_kg,
            estimated_maximum_yield_kg=yr.maximum_kg,
        )

    def _neighbors(self, x: int, y: int, side: int, start: date, end: date):
        """Existing assignments adjacent in space and overlapping in time."""
        out = []
        for a in self.assignments:
            if not dates_overlap(start, end, a.plant_date, a.removal_date):
                continue
            # touching / adjacent: expand the candidate rect by 1 cell
            if rects_overlap(
                x - 1,
                y - 1,
                side + 2,
                side + 2,
                a.x,
                a.y,
                a.width_cells,
                a.height_cells,
            ):
                out.append(a)
        return out

    def _compat_score(self, crop: CropInput, neighbors: list[Assignment]) -> float:
        bonus = 0.0
        for n in neighbors:
            rel = self.rel.get((crop.id, n.crop_id))
            if not rel:
                continue
            if rel.relationship_type == "companion":
                bonus += rel.score
            else:
                bonus -= rel.score
        return bonus

    def _score(
        self,
        crop: CropInput,
        x: int,
        y: int,
        side: int,
        plant_date: date,
        removal_date: date,
    ) -> float:
        count = estimates.plant_count(side, side, crop.spacing_cm, self.cell_cm)
        mid_yield = count * (crop.minimum_yield_kg + crop.maximum_yield_kg) / 2
        norm_yield = min(1.0, mid_yield / 10.0)

        pref = _PRIORITY_WEIGHT.get(crop.priority, 0.3)
        neighbors = self._neighbors(x, y, side, plant_date, removal_date)
        compat = self._compat_score(crop, neighbors)
        util = (side * side) / max(1, self.rows * self.cols)
        duration = (removal_date - plant_date).days
        spread = min(1.0, duration / 90.0)

        # shade penalty: tall crop north of (above, smaller y) shorter neighbors
        shade = 0.0
        for n in neighbors:
            if crop.height_cm > 100 and n.y > y:
                shade += 0.5

        return (
            W_YIELD * norm_yield
            + W_PREF * pref
            + W_COMPAT * compat
            + W_UTIL * util
            + W_SPREAD * spread
            - W_SHADE * shade
        )

    # -- stages ------------------------------------------------------------ #
    def _too_big_reason(self, crop: CropInput, side: int) -> str | None:
        if side > self.rows or side > self.cols:
            area_m2 = round((crop.spacing_cm / 100) ** 2, 2)
            return (
                f"{crop.name} needs about {area_m2} m² per plant; this garden is "
                f"too small. Try a compact variety instead."
            )
        return None

    def _place_one(self, crop: CropInput, not_before: date) -> Assignment | None:
        side = self._block_side(crop)
        plant_date = self._earliest_plant_date(crop, not_before)
        if plant_date is None:
            return None
        harvest_end = plant_date + timedelta(
            days=crop.days_to_maturity + crop.harvest_duration_days
        )
        pos = self.grid.find_free_region(side, side, plant_date, harvest_end)
        if pos is None:
            return None
        x, y = pos
        assignment = self._make_assignment(crop, x, y, side, plant_date)
        self.grid.reserve(x, y, side, side, plant_date, assignment.removal_date)
        self.assignments.append(assignment)
        return assignment

    def _stage1_primary(self, must_haves: list[CropInput]) -> None:
        # Large / slow crops first so they are not crowded out.
        ordered = sorted(
            must_haves,
            key=lambda c: (self._block_side(c) ** 2, c.days_to_maturity),
            reverse=True,
        )
        for crop in ordered:
            if not self._light_ok(crop):
                self.unplaced.append(
                    Unplaced(
                        crop.id,
                        f"{crop.name} needs {crop.sunlight_requirement.replace('_', ' ')}; "
                        f"this garden is {self.sunlight_level.replace('_', ' ')}.",
                    )
                )
                continue
            side = self._block_side(crop)
            big = self._too_big_reason(crop, side)
            if big:
                self.unplaced.append(Unplaced(crop.id, big))
                continue
            placed = self._place_one(crop, self.season_start)
            if placed:
                placed.explanation = self._explain_primary(crop)
            else:
                self.unplaced.append(
                    Unplaced(
                        crop.id,
                        f"{crop.name}'s planting window has passed or there was no "
                        f"free space for it this season.",
                    )
                )

    def _stage2_fill(self, candidates: list[CropInput]) -> None:
        # Try to place each remaining selected crop once, best-scoring position.
        for crop in candidates:
            if not self._light_ok(crop):
                self.unplaced.append(
                    Unplaced(
                        crop.id,
                        f"{crop.name} needs {crop.sunlight_requirement.replace('_', ' ')}; "
                        f"this garden is {self.sunlight_level.replace('_', ' ')}.",
                    )
                )
                continue
            side = self._block_side(crop)
            big = self._too_big_reason(crop, side)
            if big:
                self.unplaced.append(Unplaced(crop.id, big))
                continue

            plant_date = self._earliest_plant_date(crop, self.season_start)
            if plant_date is None:
                self.unplaced.append(
                    Unplaced(
                        crop.id,
                        f"{crop.name}'s planting window does not fit this season.",
                    )
                )
                continue
            harvest_end = plant_date + timedelta(
                days=crop.days_to_maturity + crop.harvest_duration_days
            )

            best_pos = None
            best_score = float("-inf")
            for y in range(0, self.rows - side + 1):
                for x in range(0, self.cols - side + 1):
                    if self.grid.region_free(x, y, side, side, plant_date, harvest_end):
                        s = self._score(crop, x, y, side, plant_date, harvest_end)
                        if s > best_score:
                            best_score = s
                            best_pos = (x, y)
            if best_pos is None:
                self.unplaced.append(
                    Unplaced(
                        crop.id,
                        f"There was no free space-time left in the garden for {crop.name}.",
                    )
                )
                continue
            x, y = best_pos
            assignment = self._make_assignment(crop, x, y, side, plant_date)
            self.grid.reserve(x, y, side, side, plant_date, assignment.removal_date)
            assignment.explanation = self._explain_fill(crop, x, y, side, harvest_end)
            self.assignments.append(assignment)

    def _stage3_succession(self, all_selected: list[CropInput]) -> None:
        """Plant successors in cells that free up mid-season."""
        candidates = sorted(all_selected, key=lambda c: c.days_to_maturity)
        changed = True
        guard = 0
        while changed and guard < 50:
            changed = False
            guard += 1
            for pred in list(self.assignments):
                if pred.successor_assignment_id is not None:
                    continue
                free_from = pred.removal_date + timedelta(days=1)
                if free_from >= self.season_end:
                    continue
                side = pred.width_cells
                best = None
                best_score = float("-inf")
                for crop in candidates:
                    if self._block_side(crop) != side or not self._light_ok(crop):
                        continue
                    plant_date = self._earliest_plant_date(crop, free_from)
                    if plant_date is None or plant_date <= pred.removal_date:
                        continue
                    harvest_end = plant_date + timedelta(
                        days=crop.days_to_maturity + crop.harvest_duration_days
                    )
                    if not self.grid.region_free(
                        pred.x, pred.y, side, side, plant_date, harvest_end
                    ):
                        continue
                    s = self._score(
                        crop, pred.x, pred.y, side, plant_date, harvest_end
                    )
                    if s > best_score:
                        best_score = s
                        best = (crop, plant_date)
                if best is None:
                    continue
                crop, plant_date = best
                succ = self._make_assignment(crop, pred.x, pred.y, side, plant_date)
                self.grid.reserve(
                    pred.x, pred.y, side, side, plant_date, succ.removal_date
                )
                succ.explanation = (
                    f"Succeeds {pred.crop} in the same cells once it is cleared "
                    f"on {pred.removal_date.isoformat()}."
                )
                pred.successor_assignment_id = succ.id
                self.assignments.append(succ)
                changed = True

    # -- explanations ------------------------------------------------------ #
    def _explain_primary(self, crop: CropInput) -> str:
        return (
            f"{crop.name} is a must-have, placed first so slower or larger crops "
            f"claim their space before the garden fills up."
        )

    def _explain_fill(
        self, crop: CropInput, x: int, y: int, side: int, end: date
    ) -> str:
        neighbors = self._neighbors(x, y, side, self.season_start, end)
        companion = next(
            (
                n.crop
                for n in neighbors
                if (rel := self.rel.get((crop.id, n.crop_id)))
                and rel.relationship_type == "companion"
            ),
            None,
        )
        if companion:
            return f"Placed next to {companion}, a good companion, to share the space."
        if crop.height_cm > 100:
            return f"Tall crop placed to avoid shading shorter neighbors."
        return f"Filled an open area that fits {crop.name}'s spacing and sun needs."

    # -- utilization ------------------------------------------------------- #
    def _compute_utilization(self) -> float:
        season_days = max(1, (self.season_end - self.season_start).days)
        total_cell_days = self.rows * self.cols * season_days
        if total_cell_days == 0:
            return 0.0
        used = 0
        for a in self.assignments:
            duration = (a.removal_date - a.plant_date).days
            used += a.width_cells * a.height_cells * duration
        return round(min(1.0, used / total_cell_days), 2)

    # -- entry point ------------------------------------------------------- #
    def run(self) -> OptimizerResult:
        if self.rows == 0 or self.cols == 0:
            for crop in self.crops:
                self.unplaced.append(
                    Unplaced(crop.id, "The garden is too small to place any crops.")
                )
            return OptimizerResult([], self.unplaced, 0.0)

        must = [c for c in self.crops if c.priority == "must_have"]
        rest = [c for c in self.crops if c.priority != "must_have"]
        # preferred before optional (stable within groups)
        rest.sort(key=lambda c: 0 if c.priority == "preferred" else 1)

        self._stage1_primary(must)
        self._stage2_fill(rest)
        self._stage3_succession(self.crops)

        return OptimizerResult(
            assignments=self.assignments,
            unplaced=self.unplaced,
            space_utilization=self._compute_utilization(),
        )
