from datetime import datetime, timezone

from fastapi import APIRouter, Query, Response

from ..auth import CurrentUser
from ..crops_repo import get_crop
from ..errors import not_found, validation_error
from ..models.schemas import (
    MarketplaceListing,
    MarketplaceListingCreate,
    MarketplaceListingUpdate,
)
from ..supabase_client import get_supabase

router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])


def _profiles_by_id(user_ids: list[str]) -> dict[str, dict]:
    ids = [uid for uid in {u for u in user_ids if u}]
    if not ids:
        return {}
    sb = get_supabase()
    res = sb.table("profiles").select("id, display_name, city").in_("id", ids).execute()
    return {row["id"]: row for row in (res.data or [])}


def _to_listing(row: dict, profiles: dict[str, dict], user_id: str) -> MarketplaceListing:
    seller = profiles.get(row["user_id"]) or {}
    reserver = profiles.get(row.get("reserved_by")) or {}
    crop = get_crop(row["crop_id"]) if row.get("crop_id") else None
    return MarketplaceListing(
        id=row["id"],
        crop_id=row.get("crop_id"),
        crop_name=crop.name if crop else None,
        title=row["title"],
        exchange_type=row.get("exchange_type"),
        price_per_unit=row.get("price_per_unit"),
        quantity=row.get("quantity"),
        unit=row.get("unit"),
        city=row.get("city"),
        description=row.get("description"),
        status=row["status"],
        seller_name=seller.get("display_name"),
        seller_city=seller.get("city"),
        reserved_by_name=reserver.get("display_name"),
        is_mine=row["user_id"] == user_id,
        is_reserved_by_me=row.get("reserved_by") == user_id,
        created_at=row.get("created_at"),
    )


def _fetch_listing(listing_id: str) -> dict:
    sb = get_supabase()
    res = (
        sb.table("marketplace_listings")
        .select("*")
        .eq("id", listing_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise not_found("Listing not found")
    return res.data[0]


def _my_city(user_id: str) -> str | None:
    sb = get_supabase()
    res = sb.table("profiles").select("city").eq("id", user_id).limit(1).execute()
    return (res.data[0].get("city") if res.data else None) or None


def _my_name(user_id: str) -> str:
    sb = get_supabase()
    res = (
        sb.table("profiles").select("display_name").eq("id", user_id).limit(1).execute()
    )
    return (res.data[0].get("display_name") if res.data else None) or "A neighbor"


@router.post("/listings", response_model=MarketplaceListing)
async def create_listing(
    body: MarketplaceListingCreate, user_id: CurrentUser
) -> MarketplaceListing:
    if body.exchange_type == "sell" and body.price_per_unit is None:
        raise validation_error("A price is required for a listing that is for sale.")
    if body.crop_id and not get_crop(body.crop_id):
        raise validation_error("Unknown crop.")

    sb = get_supabase()
    payload = {
        "user_id": user_id,
        "crop_id": body.crop_id,
        "title": body.title,
        "exchange_type": body.exchange_type,
        "price_per_unit": body.price_per_unit,
        "quantity": body.quantity,
        "unit": body.unit,
        "city": body.city or _my_city(user_id),
        "description": body.description,
        "status": "published",
    }
    res = sb.table("marketplace_listings").insert(payload).execute()
    row = res.data[0]
    return _to_listing(row, _profiles_by_id([row["user_id"]]), user_id)


@router.get("/listings", response_model=list[MarketplaceListing])
async def browse_listings(
    user_id: CurrentUser,
    crop_id: str | None = Query(default=None),
    city: str | None = Query(default=None),
    exchange_type: str | None = Query(default=None),
) -> list[MarketplaceListing]:
    """Published, unreserved listings from other users — who you can buy from."""
    sb = get_supabase()
    q = (
        sb.table("marketplace_listings")
        .select("*")
        .eq("status", "published")
        .is_("reserved_by", "null")
        .neq("user_id", user_id)
    )
    if crop_id:
        q = q.eq("crop_id", crop_id)
    if city:
        q = q.ilike("city", f"%{city}%")
    if exchange_type:
        q = q.eq("exchange_type", exchange_type)
    rows = (q.order("created_at", desc=True).execute()).data or []
    profiles = _profiles_by_id([r["user_id"] for r in rows])
    return [_to_listing(r, profiles, user_id) for r in rows]


@router.get("/listings/mine", response_model=list[MarketplaceListing])
async def my_listings(user_id: CurrentUser) -> list[MarketplaceListing]:
    sb = get_supabase()
    rows = (
        sb.table("marketplace_listings")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    ).data or []
    profiles = _profiles_by_id(
        [r["user_id"] for r in rows] + [r.get("reserved_by") for r in rows]
    )
    return [_to_listing(r, profiles, user_id) for r in rows]


@router.get("/listings/reserved", response_model=list[MarketplaceListing])
async def reserved_listings(user_id: CurrentUser) -> list[MarketplaceListing]:
    """Listings the caller has reserved — who they are buying from."""
    sb = get_supabase()
    rows = (
        sb.table("marketplace_listings")
        .select("*")
        .eq("reserved_by", user_id)
        .order("reserved_at", desc=True)
        .execute()
    ).data or []
    profiles = _profiles_by_id([r["user_id"] for r in rows])
    return [_to_listing(r, profiles, user_id) for r in rows]


@router.patch("/listings/{listing_id}", response_model=MarketplaceListing)
async def update_listing(
    listing_id: str, body: MarketplaceListingUpdate, user_id: CurrentUser
) -> MarketplaceListing:
    row = _fetch_listing(listing_id)
    if row["user_id"] != user_id:
        raise not_found("Listing not found")
    updates = body.model_dump(exclude_none=True)
    sb = get_supabase()
    if updates:
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        res = (
            sb.table("marketplace_listings")
            .update(updates)
            .eq("id", listing_id)
            .execute()
        )
        row = res.data[0]
    return _to_listing(row, _profiles_by_id([row["user_id"]]), user_id)


@router.delete("/listings/{listing_id}", status_code=204)
async def delete_listing(listing_id: str, user_id: CurrentUser) -> Response:
    row = _fetch_listing(listing_id)
    if row["user_id"] != user_id:
        raise not_found("Listing not found")
    sb = get_supabase()
    sb.table("marketplace_listings").delete().eq("id", listing_id).execute()
    return Response(status_code=204)


@router.post("/listings/{listing_id}/reserve", response_model=MarketplaceListing)
async def reserve_listing(listing_id: str, user_id: CurrentUser) -> MarketplaceListing:
    row = _fetch_listing(listing_id)
    if row["user_id"] == user_id:
        raise validation_error("You can't reserve your own listing.")
    if row["status"] != "published" or row.get("reserved_by"):
        raise validation_error("This listing is no longer available.")

    sb = get_supabase()
    now = datetime.now(timezone.utc).isoformat()
    res = (
        sb.table("marketplace_listings")
        .update({"reserved_by": user_id, "reserved_at": now, "status": "reserved"})
        .eq("id", listing_id)
        .execute()
    )
    row = res.data[0]

    # Notify the seller (secret key bypasses RLS, same as the n8n webhook).
    sb.table("notifications").insert(
        {
            "user_id": row["user_id"],
            "type": "marketplace_reserved",
            "title": f"{_my_name(user_id)} reserved your listing",
            "message": f'"{row["title"]}" has been reserved. Reach out to arrange the handoff.',
            "is_read": False,
        }
    ).execute()
    return _to_listing(row, _profiles_by_id([row["user_id"], user_id]), user_id)


@router.delete("/listings/{listing_id}/reserve", response_model=MarketplaceListing)
async def cancel_reservation(
    listing_id: str, user_id: CurrentUser
) -> MarketplaceListing:
    row = _fetch_listing(listing_id)
    if row.get("reserved_by") != user_id:
        raise validation_error("You have not reserved this listing.")
    sb = get_supabase()
    res = (
        sb.table("marketplace_listings")
        .update({"reserved_by": None, "reserved_at": None, "status": "published"})
        .eq("id", listing_id)
        .execute()
    )
    row = res.data[0]
    return _to_listing(row, _profiles_by_id([row["user_id"]]), user_id)
