import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { ActivityCard } from "@/features/dashboard/ActivityCard";
import { TasksCard } from "@/features/dashboard/TasksCard";
import { WeatherCard } from "@/features/dashboard/WeatherCard";
import { ImpactSummary } from "@/features/dashboard/ImpactSummary";
import {
  ArrowRightIcon,
  CalendarIcon,
  CompassIcon,
  GridIcon,
  KebabIcon,
  LayoutGridIcon,
  LeafIcon,
  RulerIcon,
  SeedIcon,
  ShopBagIcon,
  SparkleIcon,
} from "@/features/dashboard/icons";
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

// Rough planting density used only to give the mocked "crops growing" count
// on each garden card something plausible to show until real crop counts
// come from the plans API.
function cropsGrowing(g: Garden) {
  return Math.max(4, Math.round(g.width_m * g.length_m * 0.7));
}

// Garden photos aren't uploaded by users yet, so cards are matched to a
// curated image by garden name, falling back to a rotation of the same set.
const GARDEN_IMAGES_BY_NAME: Record<string, string> = {
  frontyard: "/gardens/frontyard.png",
  backyard: "/gardens/backyard.png",
  "sunny background": "/gardens/sunny-background.png",
  bed: "/gardens/bed.png",
};
const FALLBACK_GARDEN_IMAGES = Object.values(GARDEN_IMAGES_BY_NAME);

function gardenImage(g: Garden, index: number) {
  return (
    GARDEN_IMAGES_BY_NAME[g.name.trim().toLowerCase()] ??
    FALLBACK_GARDEN_IMAGES[index % FALLBACK_GARDEN_IMAGES.length]
  );
}

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-slate-100">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sprout-100 text-sprout-700">
        <div className="h-5 w-5">{icon}</div>
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-500">{label}</p>
        <p className="truncate text-base font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sprout-50 text-sprout-700">
        <div className="h-4 w-4">{icon}</div>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
        <p className="truncate text-xs text-slate-500">{subtitle}</p>
      </div>
    </Link>
  );
}

export function Dashboard() {
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Two-step delete: first click arms the confirm, second click deletes.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
      setOpenMenuId(null);
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

  const totalAreaM2 = gardens.reduce((sum, g) => sum + g.width_m * g.length_m, 0);
  const totalCrops = gardens.reduce((sum, g) => sum + cropsGrowing(g), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10 xl:px-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8 xl:grid-cols-[1fr_360px] xl:gap-10">
          <div>
            {/* Hero */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sprout-50 via-sprout-50/60 to-white p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-sprout-600">
                    {getGreeting()}, gardener
                    <LeafIcon className="h-4 w-4" />
                  </p>
                  <h1 className="mt-1 text-4xl font-semibold text-slate-900 sm:text-5xl">
                    Your gardens
                  </h1>
                  <p className="mt-2 max-w-sm text-sm text-slate-500">
                    This season you're growing more good in every way.
                  </p>
                </div>

                <div className="flex w-full items-center gap-4 lg:w-auto">
                  <Link
                    to="/gardens/new"
                    className="btn-primary shrink-0 self-start rounded-full px-5"
                  >
                    + Create garden
                  </Link>
                </div>
              </div>

              {!loading && !error && gardens.length > 0 && (
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:mt-10 lg:gap-4">
                  <QuickStat
                    icon={<GridIcon className="h-full w-full" />}
                    label="Total gardens"
                    value={String(gardens.length)}
                  />
                  <QuickStat
                    icon={<RulerIcon className="h-full w-full" />}
                    label="Total planted area"
                    value={`${Math.round(totalAreaM2)} m²`}
                  />
                  <QuickStat
                    icon={<SparkleIcon className="h-full w-full" />}
                    label="Active crops"
                    value={String(totalCrops)}
                  />
                  <QuickStat
                    icon={<CalendarIcon className="h-full w-full" />}
                    label="Next harvest window"
                    value="May 18 – May 31"
                  />
                </div>
              )}
            </section>

            {loading && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[0, 1].map((i) => (
                  <div key={i} className="card h-32 animate-pulse bg-slate-50" />
                ))}
              </div>
            )}

            {error && (
              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {error}
              </div>
            )}

            {!loading && !error && gardens.length === 0 && (
              <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 px-8 py-16 text-center">
                <LeafIcon className="h-10 w-10 text-sprout-600" />
                <div>
                  <p className="font-semibold text-slate-900">No gardens yet</p>
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
              <>
                <ImpactSummary gardens={gardens} />

                <section className="mt-10 lg:mt-12">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Your gardens
                    </h2>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {gardens.map((g, i) => (
                      <Link
                        key={g.id}
                        to={`/gardens/${g.id}/crops`}
                        className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-sprout-200 hover:shadow-md"
                      >
                        <img
                          src={gardenImage(g, i)}
                          alt=""
                          className="h-24 w-full object-cover"
                        />
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="truncate text-sm font-semibold text-slate-900">
                              {g.name}
                            </h3>
                            <div className="flex shrink-0 items-center gap-1">
                              <span className="rounded-full bg-sprout-50 px-2 py-0.5 text-[11px] font-medium text-sprout-700">
                                {SUNLIGHT_LABEL[g.sunlight_level] ??
                                  g.sunlight_level.replace("_", " ")}
                              </span>
                              <div className="relative">
                                <button
                                  type="button"
                                  className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                  aria-label="Garden options"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpenMenuId((id) => (id === g.id ? null : g.id));
                                  }}
                                  onBlur={() =>
                                    setTimeout(
                                      () =>
                                        setOpenMenuId((id) => (id === g.id ? null : id)),
                                      150
                                    )
                                  }
                                >
                                  <KebabIcon className="h-4 w-4" />
                                </button>
                                {openMenuId === g.id && (
                                  <div
                                    className="absolute right-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                                    onClick={(e) => e.preventDefault()}
                                  >
                                    <button
                                      type="button"
                                      className={
                                        confirmingId === g.id
                                          ? "block w-full px-3.5 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                                          : "block w-full px-3.5 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                                      }
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDelete(g.id);
                                      }}
                                      disabled={deletingId === g.id}
                                    >
                                      {deletingId === g.id
                                        ? "Deleting…"
                                        : confirmingId === g.id
                                          ? "Really delete?"
                                          : "Delete garden"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {g.city ?? "No location set"} · {g.width_m}m × {g.length_m}m
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {cropsGrowing(g)} crops growing
                          </p>
                          <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-sprout-700">
                            View layout
                            <ArrowRightIcon className="h-3 w-3" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-2 sm:grid-cols-4 lg:mt-8">
                    <QuickAction
                      icon={<SeedIcon className="h-full w-full" />}
                      title="Plan crops"
                      subtitle="What to plant next"
                      to={`/gardens/${gardens[0].id}/crops`}
                    />
                    <QuickAction
                      icon={<LayoutGridIcon className="h-full w-full" />}
                      title="View layout"
                      subtitle="See your garden maps"
                      to={`/gardens/${gardens[0].id}/crops`}
                    />
                    <QuickAction
                      icon={<ShopBagIcon className="h-full w-full" />}
                      title="Shop seeds"
                      subtitle="Curated for your zone"
                      to="/marketplace"
                    />
                    <QuickAction
                      icon={<CompassIcon className="h-full w-full" />}
                      title="See recommendations"
                      subtitle="Personalized for you"
                      to="/marketplace"
                    />
                  </div>
                </section>
              </>
            )}
          </div>

          <aside className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:flex lg:flex-col lg:gap-6">
            <WeatherCard />
            <TasksCard />
            <ActivityCard />
          </aside>
        </div>
      </main>
    </div>
  );
}
