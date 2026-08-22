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
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-3xl font-extrabold text-slate-900">Your gardens</h1>
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
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Link to={`/gardens/${g.id}/crops`} className="btn-secondary">
                      Plan crops
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
          </div>

          <div>
            <NotificationPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
