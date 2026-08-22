import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { cropsApi } from "@/features/crops/api";
import { plansApi } from "@/features/plans/api";
import type { Crop, CropPriority, CropSelection } from "@/types";

export function Crops() {
  const { gardenId = "" } = useParams();
  const navigate = useNavigate();

  const [crops, setCrops] = useState<Crop[]>([]);
  const [selections, setSelections] = useState<Record<string, CropPriority>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    cropsApi
      .list()
      .then(setCrops)
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : "Could not load crops (is the backend running?)."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const toggle = (cropId: string) => {
    setSelections((prev) => {
      const next = { ...prev };
      if (next[cropId]) delete next[cropId];
      else next[cropId] = "preferred";
      return next;
    });
  };

  const cyclePriority = (cropId: string) => {
    setSelections((prev) => {
      const order: CropPriority[] = ["preferred", "must_have", "optional"];
      const current = prev[cropId] ?? "preferred";
      const next = order[(order.indexOf(current) + 1) % order.length];
      return { ...prev, [cropId]: next };
    });
  };

  const selectedCount = Object.keys(selections).length;

  const priorityStyles: Record<CropPriority, string> = useMemo(
    () => ({
      must_have: "bg-sprout-600 text-white",
      preferred: "bg-sprout-100 text-sprout-800",
      optional: "bg-slate-100 text-slate-600",
    }),
    []
  );

  const generate = async () => {
    setError(null);
    setGenerating(true);
    try {
      const payload: CropSelection[] = Object.entries(selections).map(
        ([crop_id, priority]) => ({ crop_id, priority })
      );
      const { plan } = await plansApi.generate(gardenId, payload);
      navigate(`/plans/${plan.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not generate a plan."
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pick your crops</h1>
            <p className="text-sm text-slate-500">
              Tap the priority chip to mark a crop must-have.
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={generate}
            disabled={selectedCount === 0 || generating}
          >
            {generating
              ? "Generating…"
              : `Generate plan (${selectedCount})`}
          </button>
        </div>

        {loading && <p className="text-slate-500">Loading crops…</p>}
        {error && (
          <div className="card border-amber-200 bg-amber-50 text-sm text-amber-800">
            {error}
          </div>
        )}

        {!loading && crops.length === 0 && !error && (
          <div className="card text-sm text-slate-600">
            No crops available yet. The backend seeds the curated crop list.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {crops.map((crop) => {
            const priority = selections[crop.id];
            const selected = Boolean(priority);
            return (
              <div
                key={crop.id}
                className={`card cursor-pointer transition ${
                  selected ? "ring-2 ring-sprout-500" : "hover:border-sprout-300"
                }`}
                onClick={() => toggle(crop.id)}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-slate-900">{crop.name}</h3>
                  {selected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cyclePriority(crop.id);
                      }}
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityStyles[priority]}`}
                    >
                      {priority.replace("_", " ")}
                    </button>
                  )}
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-500">
                  <div>Spacing: {crop.spacing_cm} cm</div>
                  <div>Maturity: {crop.days_to_maturity}d</div>
                  <div>Sun: {crop.sunlight_requirement.replace("_", " ")}</div>
                  <div>Difficulty: {crop.difficulty}</div>
                </dl>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
