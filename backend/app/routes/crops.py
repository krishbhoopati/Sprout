from fastapi import APIRouter

from ..auth import CurrentUser
from ..crops_repo import all_crops, get_crop
from ..errors import not_found
from ..models.schemas import Crop

router = APIRouter(prefix="/api/crops", tags=["crops"])


@router.get("", response_model=list[Crop])
async def list_crops(_user: CurrentUser) -> list[Crop]:
    return all_crops()


@router.get("/{crop_id}", response_model=Crop)
async def get_one_crop(crop_id: str, _user: CurrentUser) -> Crop:
    crop = get_crop(crop_id)
    if not crop:
        raise not_found("Crop not found")
    return crop
