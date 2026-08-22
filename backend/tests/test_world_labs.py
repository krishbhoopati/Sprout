from app.services.world_labs import parse_world_assets

_ASSETS = {
    "imagery": {"pano_url": "https://cdn.example/pano.png"},
    "splats": {
        "spz_urls": {
            "100k": "https://cdn.example/100k.spz",
            "500k": "https://cdn.example/500k.spz",
        },
        "semantics_metadata": {
            "metric_scale_factor": 0.57,
            "ground_plane_offset": 1.46,
        },
    },
}


def test_parses_flat_world_response():
    # The live API returns the world object at the top level.
    parsed = parse_world_assets({"world_id": "w1", "assets": _ASSETS})
    assert parsed["pano_url"] == "https://cdn.example/pano.png"
    assert parsed["spz_urls"]["500k"] == "https://cdn.example/500k.spz"
    assert parsed["metric_scale_factor"] == 0.57
    assert parsed["ground_plane_offset"] == 1.46


def test_parses_wrapped_world_response():
    parsed = parse_world_assets({"world": {"world_id": "w1", "assets": _ASSETS}})
    assert parsed["pano_url"] == "https://cdn.example/pano.png"
    assert parsed["spz_urls"]["100k"] == "https://cdn.example/100k.spz"


def test_parses_world_without_assets():
    parsed = parse_world_assets({"world_id": "w1"})
    assert parsed["pano_url"] is None
    assert parsed["spz_urls"] == {}
