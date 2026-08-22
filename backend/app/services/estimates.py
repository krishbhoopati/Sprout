"""Transparent yield and grocery-savings math. Ranges only (IMPLEMENTATION.md §15)."""

from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass
class YieldRange:
    minimum_kg: float
    maximum_kg: float


@dataclass
class SavingsRange:
    minimum: float
    maximum: float


def plants_per_cell_footprint(spacing_cm: float, cell_cm: float) -> float:
    """How many plants fit in a single grid cell, given spacing.

    A plant occupies a spacing_cm x spacing_cm footprint. Returns plants per
    cell (may be < 1 for widely spaced crops, or > 1 for tightly spaced ones).
    """
    footprint_area = spacing_cm * spacing_cm
    cell_area = cell_cm * cell_cm
    return cell_area / footprint_area


def plant_count(
    width_cells: int, height_cells: int, spacing_cm: float, cell_cm: float
) -> int:
    """Number of plants that fit in a rectangular region of grid cells."""
    cells = width_cells * height_cells
    per_cell = plants_per_cell_footprint(spacing_cm, cell_cm)
    count = math.floor(cells * per_cell)
    return max(1, count)


def yield_range(
    count: int, minimum_yield_kg: float, maximum_yield_kg: float
) -> YieldRange:
    """Total yield range for `count` plants. Guarantees min <= max."""
    lo = count * minimum_yield_kg
    hi = count * maximum_yield_kg
    if lo > hi:
        lo, hi = hi, lo
    return YieldRange(round(lo, 2), round(hi, 2))


def savings_range(
    minimum_kg: float, maximum_kg: float, price_per_kg: float
) -> SavingsRange:
    """Grocery-value range for a yield range. Guarantees min <= max."""
    lo = minimum_kg * price_per_kg
    hi = maximum_kg * price_per_kg
    if lo > hi:
        lo, hi = hi, lo
    return SavingsRange(round(lo, 2), round(hi, 2))
