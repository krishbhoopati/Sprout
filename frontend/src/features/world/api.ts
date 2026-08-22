import { api } from "@/lib/api";
import type { WorldGenerationStatus } from "@/types";

interface WorldStart {
  operation_id: string;
  status: string;
}

export const worldApi = {
  start: (gardenId: string) =>
    api.post<WorldStart>(`/api/gardens/${gardenId}/world`),
  status: (gardenId: string) =>
    api.get<WorldGenerationStatus>(`/api/gardens/${gardenId}/world/status`),
};
