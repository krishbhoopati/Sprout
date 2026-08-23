import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { plansApi } from "@/features/plans/api";
import { GardenGrid } from "@/features/plans/GardenGrid";
import { TimelineSlider } from "@/features/plans/TimelineSlider";
import { colorForCrop } from "@/features/plans/colors";
import { isVisibleOn, removalDate, seasonBounds, formatDate } from "@/features/plans/dates";
import { WorldPreview } from "@/features/world/WorldPreview";
import type { PlanResponse } from "@/types";

export function Plan() {
  const { planId = "" } = useParams();
  const [data, setData] = useState<PlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    let active = true;
    plansApi
      .get(planId)
      .then((res) => {
        if (!active) return;
        setData(res);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Could not load this plan."
        );
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

  // Distinct crop names, sent to World Labs so the generated world features
  // the vegetables in this plan.
  const cropNames = useMemo(
    () => [...new Set((data?.assignments ?? []).map((a) => a.crop))],
    [data]
  );

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="card border-red-200 bg-red-50 text-sm text-red-700">
            Could not load this plan: {error}
          </div>
        </main>
      </div>
    );
  }

  if (!data || !bounds || !selectedDate) {
    return (
      <div className="min-h-screen bg-slate-50">
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
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-[1600px] px-6 py-8 xl:px-10">
        <h1 className="mb-4 text-3xl font-semibold text-slate-900">
          Your planting plan
        </h1>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2.2fr_1fr]">
            {/* left column */}
            <div className="flex flex-col gap-4">
              {/* 3D preview */}
              {plan.garden_id ? (
                <WorldPreview gardenId={plan.garden_id} cropNames={cropNames} />
              ) : (
                <div className="card flex min-h-64 items-center justify-center text-sm text-slate-400">
                  No garden photo for a 3D preview.
                </div>
              )}

              {/* planting plan and timeline */}
              <div className="card">
                <h2 className="font-semibold text-slate-900">
                  Planting plan and timeline
                </h2>
                <div className="mt-3">
                  <GardenGrid
                    rows={rows}
                    cols={cols}
                    assignments={assignments}
                    selectedDate={selectedDate}
                  />
                </div>

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
            </div>

            {/* right column */}
            <div className="flex flex-col gap-4">
              {/* active */}
              <div className="card flex-1">
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
                          {formatDate(a.harvest_start)}–
                          {formatDate(a.harvest_end)}
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

              {/* season estimate */}
              <div className="card">
                <h2 className="font-semibold text-slate-900">
                  Season estimate
                </h2>
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
                  Based on typical growing conditions and estimated grocery
                  prices.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Space utilization:{" "}
                  <strong>{Math.round(plan.space_utilization * 100)}%</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

        {unplaced && unplaced.length > 0 && (
          <div className="card mt-6 border-amber-200 bg-amber-50">
            <h2 className="font-semibold text-amber-800">Couldn't place</h2>
            <ul className="mt-2 space-y-2 text-sm text-amber-800">
              {unplaced.map((u) => (
                <li key={u.crop_id}>{u.reason}</li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
