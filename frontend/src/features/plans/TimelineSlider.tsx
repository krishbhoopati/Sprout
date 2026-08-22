import { addDays, daysBetween, formatDate } from "./dates";

interface TimelineSliderProps {
  start: string;
  end: string;
  value: string;
  onChange: (iso: string) => void;
}

export function TimelineSlider({
  start,
  end,
  value,
  onChange,
}: TimelineSliderProps) {
  const totalDays = Math.max(1, daysBetween(start, end));
  const currentDay = Math.min(
    totalDays,
    Math.max(0, daysBetween(start, value))
  );

  return (
    <div className="card">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-500">Timeline</span>
        <span className="text-lg font-bold text-sprout-700">
          {formatDate(value)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={totalDays}
        value={currentDay}
        onChange={(e) => onChange(addDays(start, Number(e.target.value)))}
        className="mt-3 w-full accent-sprout-600"
      />
      <div className="mt-1 flex justify-between text-xs text-slate-400">
        <span>{formatDate(start)}</span>
        <span>{formatDate(end)}</span>
      </div>
    </div>
  );
}
