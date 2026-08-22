import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { plansApi } from "@/features/plans/api";
import { GardenGrid } from "@/features/plans/GardenGrid";
import { TimelineSlider } from "@/features/plans/TimelineSlider";
import { colorForCrop } from "@/features/plans/colors";
import { isVisibleOn, removalDate, seasonBounds, formatDate } from "@/features/plans/dates";
import { SAMPLE_PLAN } from "@/features/plans/samplePlan";
import { WorldPreview } from "@/features/world/WorldPreview";
import type { PlanResponse } from "@/types";

export function Plan() {
  const { planId = "" } = useParams();
  const [data, setData] = useState<PlanResponse | null>(null);
  const [usingSample, setUsingSample] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    let active = true;
    plansApi
      .get(planId)
      .then((res) => {
        if (!active) return;
        setData(res);
      })
      .catch(() => {
        if (!active) return;
        // Backend unavailable — fall back to the demo plan so the UI still works.
        setData(SAMPLE_PLAN);
        setUsingSample(true);
      });
    return () => {
      active = false;
    };
  }, [planId]);

  const bounds = useMemo(
    () => (data ? seasonBounds(data.assignments) : null),
    [data]
  );

  useEffect(() => {
    if (bounds && !selectedDate) setSelectedDate(bounds.start);
  }, [bounds, selectedDate]);

  const { rows, cols } = useMemo(() => {
    if (!data) return { rows: 1, cols: 1 };
    let r = 1;
    let c = 1;
    for (const a of data.assignments) {
      c = Math.max(c, a.x + a.width_cells);
      r = Math.max(r, a.y + a.height_cells);
    }
    return { rows: r, cols: c };
  }, [data]);

  if (!data || !bounds || !selectedDate) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-slate-500">Loading plan…</p>
        </main>
      </div>
    );
  }

  const { plan, assignments, unplaced } = data;
  const activeCrops = assignments.filter((a) => isVisibleOn(a, selectedDate));
  const legend = Array.from(
    new Map(assignments.map((a) => [a.crop_id, a.crop])).entries()
  );

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {usingSample && (
          <div className="card mb-4 border-amber-200 bg-amber-50 text-sm text-amber-800">
            Showing a sample plan (backend not reachable). Wire up the API to see
            your real generated plan.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h1 className="mb-3 text-2xl font-bold text-slate-900">
              Your planting plan
            </h1>
            <GardenGrid
              rows={rows}
              cols={cols}
              assignments={assignments}
              selectedDate={selectedDate}
            />

            {/* legend */}
            <div className="mt-4 flex flex-wrap gap-3">
              {legend.map(([cropId, cropName]) => (
                <span
                  key={cropId}
                  className="flex items-center gap-1.5 text-sm text-slate-600"
                >
                  <span
                    className="h-3 w-3 rounded"
                    style={{ backgroundColor: colorForCrop(cropId) }}
                  />
                  {cropName}
                </span>
              ))}
            </div>

            <div className="mt-4">
              <TimelineSlider
                start={bounds.start}
                end={bounds.end}
                value={selectedDate}
                onChange={setSelectedDate}
              />
            </div>
          </div>

          {/* side panel */}
          <aside className="space-y-4">
            <div className="card">
              <h2 className="font-semibold text-slate-900">Season estimate</h2>
              <p className="mt-2 text-sm text-slate-600">
                Roughly{" "}
                <strong>
                  {plan.estimated_minimum_yield_kg}–
                  {plan.estimated_maximum_yield_kg} kg
                </strong>{" "}
                of food, replacing about{" "}
                <strong>
                  ${plan.estimated_minimum_savings}–$
                  {plan.estimated_maximum_savings}
                </strong>{" "}
                of groceries this season.
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Based on typical growing conditions and estimated grocery prices.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Space utilization:{" "}
                <strong>{Math.round(plan.space_utilization * 100)}%</strong>
              </p>
            </div>

            <div className="card">
              <h2 className="font-semibold text-slate-900">
                Active on {formatDate(selectedDate)}
              </h2>
              {activeCrops.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  Nothing planted on this date.
                </p>
              ) : (
                <ul className="mt-2 space-y-3">
                  {activeCrops.map((a) => (
                    <li key={a.id} className="text-sm">
                      <div className="flex items-center gap-2 font-medium text-slate-900">
                        <span
                          className="h-3 w-3 rounded"
                          style={{ backgroundColor: colorForCrop(a.crop_id) }}
                        />
                        {a.crop}
                      </div>
                      <p className="text-slate-500">
                        Planted {formatDate(a.plant_date)} · harvest{" "}
                        {formatDate(a.harvest_start)}–{formatDate(a.harvest_end)}
                      </p>
                      <p className="mt-1 text-slate-600">{a.explanation}</p>
                      {a.successor_assignment_id && (
                        <p className="mt-1 text-xs text-sprout-700">
                          Hands off to a successor after{" "}
                          {formatDate(removalDate(a))}.
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {plan.garden_id && plan.garden_id !== "sample" && (
              <WorldPreview gardenId={plan.garden_id} />
            )}

            {unplaced && unplaced.length > 0 && (
              <div className="card border-amber-200 bg-amber-50">
                <h2 className="font-semibold text-amber-800">Couldn't place</h2>
                <ul className="mt-2 space-y-2 text-sm text-amber-800">
                  {unplaced.map((u) => (
                    <li key={u.crop_id}>{u.reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
