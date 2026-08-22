from app.services import estimates


def test_plant_count_dense_crop_more_than_one_per_cell():
    # radish spacing 5cm in a 30cm cell -> 36 plants per cell
    count = estimates.plant_count(1, 1, spacing_cm=5, cell_cm=30)
    assert count == 36


def test_plant_count_wide_crop_at_least_one():
    # tomato spacing 60cm in a 30cm cell -> less than 1 per cell, floored to 1
    count = estimates.plant_count(1, 1, spacing_cm=60, cell_cm=30)
    assert count == 1


def test_yield_range_is_ordered():
    # Test 8: yield calculation returns a range (min <= max)
    yr = estimates.yield_range(10, minimum_yield_kg=0.3, maximum_yield_kg=0.5)
    assert yr.minimum_kg <= yr.maximum_kg
    assert yr.minimum_kg == 3.0
    assert yr.maximum_kg == 5.0


def test_yield_range_handles_swapped_inputs():
    yr = estimates.yield_range(10, minimum_yield_kg=0.5, maximum_yield_kg=0.3)
    assert yr.minimum_kg <= yr.maximum_kg


def test_savings_range_is_ordered():
    # Test 9: savings calculation returns a range (min <= max)
    sr = estimates.savings_range(3.0, 5.0, price_per_kg=6.5)
    assert sr.minimum <= sr.maximum
    assert sr.minimum == 19.5
    assert sr.maximum == 32.5
