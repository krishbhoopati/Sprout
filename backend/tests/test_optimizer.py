from datetime import date

import pytest

from app.crops_repo import all_relationships, crop_input, get_crop
from app.services.optimizer import (
    ObstacleRect,
    Optimizer,
    dates_overlap,
    rects_overlap,
)

SEASON = (date(2027, 3, 1), date(2027, 10, 31))


def _inputs(selections):
    return [crop_input(get_crop(cid), pr) for cid, pr in selections]


def _run(
    selections,
    width_m=3.0,
    length_m=2.0,
    sunlight="full_sun",
    obstacles=None,
    cell_cm=30,
):
    return Optimizer(
        width_m=width_m,
        length_m=length_m,
        sunlight_level=sunlight,
        crops=_inputs(selections),
        relationships=all_relationships(),
        obstacles=obstacles or [],
        cell_cm=cell_cm,
        season=SEASON,
    ).run()


def test_assignments_stay_inside_boundary():
    # Test 2: every crop assignment stays inside the garden boundary.
    result = _run(
        [("lettuce", "must_have"), ("bush_beans", "preferred"), ("carrot", "preferred")]
    )
    cols = int(3.0 * 100 / 30)
    rows = int(2.0 * 100 / 30)
    assert result.assignments
    for a in result.assignments:
        assert a.x >= 0 and a.y >= 0
        assert a.x + a.width_cells <= cols
        assert a.y + a.height_cells <= rows


def test_no_overlap_in_space_and_time():
    # Test 3: no two assignments overlap in BOTH space and time.
    result = _run(
        [
            ("lettuce", "must_have"),
            ("bush_beans", "preferred"),
            ("tomato", "preferred"),
            ("carrot", "preferred"),
            ("radish", "optional"),
        ]
    )
    a = result.assignments
    for i in range(len(a)):
        for j in range(i + 1, len(a)):
            space = rects_overlap(
                a[i].x, a[i].y, a[i].width_cells, a[i].height_cells,
                a[j].x, a[j].y, a[j].width_cells, a[j].height_cells,
            )
            time = dates_overlap(
                a[i].plant_date, a[i].removal_date,
                a[j].plant_date, a[j].removal_date,
            )
            assert not (space and time), f"{a[i].crop} and {a[j].crop} overlap"


def test_no_assignment_on_obstacle():
    # Test 4: no assignment sits on an obstacle cell.
    obstacle = ObstacleRect(x=0, y=0, width_cells=2, height_cells=2)
    result = _run(
        [("lettuce", "must_have"), ("carrot", "preferred"), ("radish", "optional")],
        obstacles=[obstacle],
    )
    for a in result.assignments:
        assert not rects_overlap(
            a.x, a.y, a.width_cells, a.height_cells,
            obstacle.x, obstacle.y, obstacle.width_cells, obstacle.height_cells,
        )


def test_successor_planted_after_predecessor_removed():
    # Test 5: a successor's plant date is after its predecessor's removal date.
    result = _run([("lettuce", "must_have"), ("bush_beans", "preferred")])
    by_id = {a.id: a for a in result.assignments}
    linked = [a for a in result.assignments if a.successor_assignment_id]
    assert linked, "expected at least one succession handoff"
    for pred in linked:
        succ = by_id[pred.successor_assignment_id]
        assert succ.plant_date > pred.removal_date


def test_must_have_attempted_before_optional():
    # Test 6: must-have crops are attempted before optional crops.
    # A garden that fits only one tomato block; must-have tomato wins the space.
    result = _run(
        [("tomato", "must_have"), ("cherry_tomato", "optional")],
        width_m=0.6,
        length_m=0.6,
    )
    placed_ids = {a.crop_id for a in result.assignments}
    assert "tomato" in placed_ids
    unplaced_ids = {u.crop_id for u in result.unplaced}
    assert "cherry_tomato" in unplaced_ids


def test_impossible_crop_returns_reason():
    # Test 7: an impossible crop request returns an explanation (populates unplaced).
    result = _run([("watermelon", "must_have")], width_m=1.0, length_m=1.0)
    assert any(u.crop_id == "watermelon" and u.reason for u in result.unplaced)


def test_sunlight_mismatch_is_explained():
    result = _run([("tomato", "must_have")], sunlight="shade")
    assert any(u.crop_id == "tomato" for u in result.unplaced)
