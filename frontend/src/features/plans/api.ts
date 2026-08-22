import { api } from "@/lib/api";
import type { CropSelection, PlanResponse } from "@/types";

export const plansApi = {
  generate: (
    gardenId: string,
    selections: CropSelection[],
    gridCellCm = 30
  ) =>
    api.post<PlanResponse>(`/api/gardens/${gardenId}/plans/generate`, {
      selections,
      grid_cell_cm: gridCellCm,
    }),
  get: (planId: string) => api.get<PlanResponse>(`/api/plans/${planId}`),
};
