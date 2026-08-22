import { api } from "@/lib/api";
import type { Garden, GardenObstacle } from "@/types";

export interface CreateGardenInput {
  name: string;
  city: string;
  width_m: number;
  length_m: number;
  sunlight_level: Garden["sunlight_level"];
  latitude?: number;
  longitude?: number;
}

export const gardensApi = {
  list: () => api.get<Garden[]>("/api/gardens"),
  get: (gardenId: string) => api.get<Garden>(`/api/gardens/${gardenId}`),
  create: (input: CreateGardenInput) => api.post<Garden>("/api/gardens", input),
  update: (
    gardenId: string,
    input: Partial<CreateGardenInput> & { image_path?: string | null }
  ) => api.patch<Garden>(`/api/gardens/${gardenId}`, input),
  setObstacles: (gardenId: string, obstacles: GardenObstacle[]) =>
    api.post<{ obstacles: GardenObstacle[] }>(
      `/api/gardens/${gardenId}/obstacles`,
      { obstacles }
    ),
};
