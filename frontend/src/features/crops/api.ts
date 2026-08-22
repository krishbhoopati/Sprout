import { api } from "@/lib/api";
import type { Crop } from "@/types";

export const cropsApi = {
  list: () => api.get<Crop[]>("/api/crops"),
  get: (cropId: string) => api.get<Crop>(`/api/crops/${cropId}`),
};
