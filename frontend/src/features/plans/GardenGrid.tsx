import type { PlotAssignment } from "@/types";
import { colorForCrop } from "./colors";
import { isVisibleOn } from "./dates";

// Each grid cell is this many cm on a side (backend services/optimizer.py).
const CELL_CM = 30;

// Format a cell count as its real-world length, e.g. 2 cells -> "0.6m".
function meters(cells: number): string {
  return `${Number(((cells * CELL_CM) / 100).toFixed(1))}m`;
}

interface GardenGridProps {
  rows: number;
  cols: number;
  assignments: PlotAssignment[];
  selectedDate: string;
}

export function GardenGrid({
  rows,
  cols,
  assignments,
  selectedDate,
}: GardenGridProps) {
  const visible = assignments.filter((a) => isVisibleOn(a, selectedDate));

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-slate-300 bg-sprout-50"
      style={{ aspectRatio: `${cols} / ${rows}` }}
    >
      {/* crop blocks */}
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {visible.map((a) => (
          <div
            key={a.id}
            className="m-0.5 flex flex-col items-center justify-center rounded-md p-1 text-center text-[10px] font-semibold leading-tight text-white shadow-sm transition-all sm:text-xs"
            style={{
              gridColumn: `${a.x + 1} / span ${a.width_cells}`,
              gridRow: `${a.y + 1} / span ${a.height_cells}`,
              backgroundColor: colorForCrop(a.crop_id),
            }}
            title={a.explanation}
          >
            <span>{a.crop}</span>
            <span className="text-[9px] font-medium text-white/80 sm:text-[10px]">
              {meters(a.width_cells)} × {meters(a.height_cells)}
            </span>
          </div>
        ))}
      </div>

      {/* dashed grid lines, overlaid on top of the crop blocks */}
      <div
        className="pointer-events-none absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => (
          <div key={i} className="border border-dashed border-slate-400/60" />
        ))}
      </div>
    </div>
  );
}
