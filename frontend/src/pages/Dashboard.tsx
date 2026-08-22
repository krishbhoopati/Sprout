import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { NotificationPanel } from "@/features/notifications/NotificationPanel";
import { gardensApi } from "@/features/gardens/api";
import type { Garden } from "@/types";

export function Dashboard() {
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gardensApi
      .list()
      .then(setGardens)
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : "Could not load gardens (is the backend running?)."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-slate-900">Your gardens</h1>
              <Link to="/gardens/new" className="btn-primary">
                + Create garden
              </Link>
            </div>

            {loading && <p className="text-slate-500">Loading gardens…</p>}
            {error && (
              <div className="card border-amber-200 bg-amber-50 text-sm text-amber-800">
                {error}
              </div>
            )}

            {!loading && !error && gardens.length === 0 && (
              <div className="card text-center">
                <p className="text-slate-600">
                  You don't have any gardens yet.
                </p>
                <Link to="/gardens/new" className="btn-primary mt-4">
                  Create your first garden
                </Link>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {gardens.map((g) => (
                <div key={g.id} className="card">
                  <h3 className="font-semibold text-slate-900">{g.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {g.city ?? "—"} · {g.width_m}m × {g.length_m}m ·{" "}
                    {g.sunlight_level.replace("_", " ")}
                  </p>
                  <Link
                    to={`/gardens/${g.id}/crops`}
                    className="btn-secondary mt-4"
                  >
                    Plan crops
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div>
            <NotificationPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
