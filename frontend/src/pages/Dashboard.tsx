import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { NotificationPanel } from "@/features/notifications/NotificationPanel";
import { ImpactSummary } from "@/features/dashboard/ImpactSummary";
import { gardensApi } from "@/features/gardens/api";
import type { Garden } from "@/types";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const SUNLIGHT_LABEL: Record<string, string> = {
  full_sun: "Full sun",
  partial_sun: "Partial sun",
  shade: "Shade",
};

export function Dashboard() {
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Two-step delete: first click arms the confirm, second click deletes.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (gardenId: string) => {
    if (confirmingId !== gardenId) {
      setConfirmingId(gardenId);
      return;
    }
    setDeletingId(gardenId);
    setError(null);
    try {
      await gardensApi.remove(gardenId);
      setGardens((prev) => prev.filter((g) => g.id !== gardenId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete the garden."
      );
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

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
    <div className="min-h-screen bg-white">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 md:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-sprout-600">
              {getGreeting()}
            </p>
            <h1 className="mt-1 text-4xl font-semibold text-slate-900">
              Your gardens
            </h1>
          </div>
          <Link
            to="/gardens/new"
            className="btn-primary self-start rounded-full px-5 sm:self-auto"
          >
            + Create garden
          </Link>
        </div>

        {!loading && !error && <ImpactSummary gardens={gardens} />}

        <div className="mt-14 grid gap-12 border-t border-slate-100 pt-10 lg:grid-cols-[1fr_320px] lg:items-start">
          <section>
            {loading && (
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="card h-32 animate-pulse bg-slate-50"
                  />
                ))}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {error}
              </div>
            )}

            {!loading && !error && gardens.length === 0 && (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 px-8 py-16 text-center">
                <svg
                  viewBox="0 0 32 32"
                  className="h-10 w-10"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M16 29V14"
                    stroke="#40721d"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16 16C16 16 9 16 6 11C6 11 14 8 16 16Z"
                    fill="#72ab43"
                  />
                  <path
                    d="M16 13C16 13 17 6 24 5C24 5 24 13 16 13Z"
                    fill="#548f28"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-slate-900">
                    No gardens yet
                  </p>
                  <p className="mt-1 max-w-xs text-sm text-slate-500">
                    Add your yard, balcony, or raised bed to get a season-long
                    plan built around your space.
                  </p>
                </div>
                <Link to="/gardens/new" className="btn-primary rounded-full">
                  Create your first garden
                </Link>
              </div>
            )}

            {!loading && !error && gardens.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {gardens.map((g) => (
                  <div key={g.id} className="card-interactive">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {g.name}
                      </h3>
                      <span className="shrink-0 rounded-full bg-sprout-50 px-2.5 py-0.5 text-xs font-medium text-sprout-700">
                        {SUNLIGHT_LABEL[g.sunlight_level] ??
                          g.sunlight_level.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {g.city ?? "No location set"} · {g.width_m}m ×{" "}
                      {g.length_m}m
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <Link
                        to={`/gardens/${g.id}/crops`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-sprout-700 transition hover:gap-1.5 hover:text-sprout-800"
                      >
                        Plan crops
                        <svg
                          viewBox="0 0 16 16"
                          className="h-3.5 w-3.5"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M6 3.5L10.5 8L6 12.5"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Link>
                      <button
                        type="button"
                        className={
                          confirmingId === g.id
                            ? "btn bg-red-600 text-white hover:bg-red-700"
                            : "btn border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600"
                        }
                        onClick={() => handleDelete(g.id)}
                        onBlur={() =>
                          setConfirmingId((id) => (id === g.id ? null : id))
                        }
                        disabled={deletingId === g.id}
                      >
                        {deletingId === g.id
                          ? "Deleting…"
                          : confirmingId === g.id
                            ? "Really delete?"
                            : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="lg:border-l lg:border-slate-100 lg:pl-10">
            <NotificationPanel />
          </aside>
        </div>
      </main>
    </div>
  );
}
