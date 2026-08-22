import { api, apiFetchBlob } from "@/lib/api";
import type { WorldGenerationStatus } from "@/types";

interface WorldStart {
  operation_id: string;
  status: string;
}

export interface WorldAssets {
  world_id: string;
  // Direct World Labs CDN URL of the splat scene (CDN allows cross-origin GETs).
  splat_url: string | null;
  spz_urls: Record<string, string>;
  metric_scale_factor: number | null;
  ground_plane_offset: number | null;
}

export const worldApi = {
  start: (gardenId: string, crops?: string[]) =>
    api.post<WorldStart>(
      `/api/gardens/${gardenId}/world`,
      crops && crops.length ? { crops } : undefined
    ),
  status: (gardenId: string) =>
    api.get<WorldGenerationStatus>(`/api/gardens/${gardenId}/world/status`),
  assets: (gardenId: string) =>
    api.get<WorldAssets>(`/api/gardens/${gardenId}/world/assets`),
  // Fetches the generated world's panorama and returns a same-origin object URL
  // suitable for a WebGL texture. Caller must revoke it when done.
  panoObjectUrl: async (gardenId: string) => {
    const blob = await apiFetchBlob(`/api/gardens/${gardenId}/world/pano`);
    return URL.createObjectURL(blob);
  },
};

export function marbleWorldUrl(worldId: string): string {
  return `https://marble.worldlabs.ai/world/${worldId}`;
}
