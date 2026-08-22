import type { PlotAssignment } from "@/types";
import { colorForCrop } from "@/features/plans/colors";

export type CropForm = "leafy" | "root" | "vine" | "fruiting";

/** Best-effort visual form for a crop, used to pick a 3D plant shape. */
export function cropForm(cropId: string, cropName: string): CropForm {
  const s = `${cropId} ${cropName}`.toLowerCase();
  if (/bean|pea|cucumber|squash|melon|gourd|zucchini|vine|grape/.test(s)) return "vine";
  if (/carrot|radish|beet|turnip|onion|garlic|potato|parsnip|leek|ginger/.test(s))
    return "root";
  if (/tomato|pepper|eggplant|aubergine|corn|okra|strawberr/.test(s)) return "fruiting";
  return "leafy";
}

/**
 * Builds a same-origin URL to the checked-in demo world, parameterized with the
 * user's real garden: grid size + one plant per occupied cell (matching the 2D
 * grid position, crop form, and legend color). The demo world renders this into
 * an explorable 3D bed. Falls back to a generic garden when there are no crops.
 */
export function buildDemoWorldUrl(
  cols: number,
  rows: number,
  assignments: PlotAssignment[]
): string {
  // One plant per cell: keep the earliest-planted crop when a cell is reused
  // by a successor, so the 3D bed shows a clean single planting per cell.
  const byCell = new Map<string, PlotAssignment>();
  for (const a of assignments) {
    const key = `${a.x},${a.y}`;
    const cur = byCell.get(key);
    if (!cur || a.plant_date < cur.plant_date) byCell.set(key, a);
  }

  const plants = [...byCell.values()].map((a) => ({
    x: a.x,
    y: a.y,
    w: a.width_cells,
    h: a.height_cells,
    form: cropForm(a.crop_id, a.crop),
    color: colorForCrop(a.crop_id),
    name: a.crop,
  }));

  const params = new URLSearchParams({
    cols: String(cols),
    rows: String(rows),
    plants: JSON.stringify(plants),
  });
  return `/demo-world/index.html?${params.toString()}`;
}
