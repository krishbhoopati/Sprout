import type { PlotAssignment } from "@/types";

export function removalDate(a: PlotAssignment): string {
  return a.removal_date ?? a.harvest_end;
}

/**
 * The single predicate that drives the timeline animation (IMPLEMENTATION.md §17):
 * an assignment is visible only when plant_date <= selected <= removal_date.
 */
export function isVisibleOn(a: PlotAssignment, selectedIso: string): boolean {
  return a.plant_date <= selectedIso && selectedIso <= removalDate(a);
}

export function seasonBounds(assignments: PlotAssignment[]): {
  start: string;
  end: string;
} {
  if (assignments.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    return { start: today, end: today };
  }
  let start = assignments[0].plant_date;
  let end = removalDate(assignments[0]);
  for (const a of assignments) {
    if (a.plant_date < start) start = a.plant_date;
    const rem = removalDate(a);
    if (rem > end) end = rem;
  }
  return { start, end };
}

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

export function daysBetween(a: string, b: string): number {
  const ms =
    new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime();
  return Math.round(ms / 86400000);
}

export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
