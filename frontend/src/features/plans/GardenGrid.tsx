import type { PlotAssignment } from "@/types";
import { colorForCrop } from "./colors";
import { isVisibleOn } from "./dates";

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
      {/* grid lines */}
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => (
          <div key={i} className="border border-sprout-100/70" />
        ))}
      </div>

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
            className="m-0.5 flex items-center justify-center rounded-md p-1 text-center text-[10px] font-semibold leading-tight text-white shadow-sm transition-all sm:text-xs"
            style={{
              gridColumn: `${a.x + 1} / span ${a.width_cells}`,
              gridRow: `${a.y + 1} / span ${a.height_cells}`,
              backgroundColor: colorForCrop(a.crop_id),
            }}
            title={a.explanation}
          >
            {a.crop}
          </div>
        ))}
      </div>
    </div>
  );
}
