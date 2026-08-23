import { api } from "@/lib/api";
import type { MarketplaceListing, MarketplaceListingCreate } from "@/types";

export interface BrowseFilters {
  crop_id?: string;
  city?: string;
  exchange_type?: string;
}

function query(filters: BrowseFilters): string {
  const params = new URLSearchParams();
  if (filters.crop_id) params.set("crop_id", filters.crop_id);
  if (filters.city) params.set("city", filters.city);
  if (filters.exchange_type) params.set("exchange_type", filters.exchange_type);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const marketplaceApi = {
  // Other people's published, unreserved listings — who you can buy from.
  browse: (filters: BrowseFilters = {}) =>
    api.get<MarketplaceListing[]>(`/api/marketplace/listings${query(filters)}`),
  mine: () => api.get<MarketplaceListing[]>("/api/marketplace/listings/mine"),
  reserved: () =>
    api.get<MarketplaceListing[]>("/api/marketplace/listings/reserved"),
  create: (body: MarketplaceListingCreate) =>
    api.post<MarketplaceListing>("/api/marketplace/listings", body),
  remove: (id: string) => api.delete<void>(`/api/marketplace/listings/${id}`),
  reserve: (id: string) =>
    api.post<MarketplaceListing>(`/api/marketplace/listings/${id}/reserve`),
  cancelReserve: (id: string) =>
    api.delete<MarketplaceListing>(`/api/marketplace/listings/${id}/reserve`),
};
