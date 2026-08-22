import { useState } from "react";
import { ArrowRightIcon } from "./icons";

interface Task {
  id: string;
  label: string;
  due: string;
}

// Task tracking isn't wired up to the backend yet; this is illustrative
// content until a real tasks API exists.
const INITIAL_TASKS: Task[] = [
  { id: "t1", label: "Water tomatoes", due: "Today" },
  { id: "t2", label: "Harvest lettuce", due: "Tomorrow" },
  { id: "t3", label: "Fertilize peppers", due: "May 17" },
  { id: "t4", label: "Start fall seedlings", due: "May 19" },
];

export function TasksCard() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const remaining = INITIAL_TASKS.filter((t) => !done[t.id]).length;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Upcoming tasks</h2>
        {remaining > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sprout-600 px-1.5 text-xs font-semibold text-white">
            {remaining}
          </span>
        )}
      </div>

      <ul className="mt-3 divide-y divide-slate-100">
        {INITIAL_TASKS.map((task) => (
          <li key={task.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
            <label className="flex min-w-0 items-center gap-2.5">
              <input
                type="checkbox"
                checked={!!done[task.id]}
                onChange={() =>
                  setDone((prev) => ({ ...prev, [task.id]: !prev[task.id] }))
                }
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-sprout-600 focus:ring-sprout-400"
              />
              <span
                className={`truncate text-sm ${
                  done[task.id] ? "text-slate-400 line-through" : "text-slate-700"
                }`}
              >
                {task.label}
              </span>
            </label>
            <span className="shrink-0 text-xs text-slate-400">{task.due}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sprout-700 transition hover:gap-1.5 hover:text-sprout-800"
      >
        View all tasks
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
