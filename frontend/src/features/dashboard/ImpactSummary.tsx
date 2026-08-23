import { useState } from "react";
import { estimateImpact, type GardenImpact } from "./impact";
import {
  CarIcon,
  CloudIcon,
  CoinIcon,
  LeafIcon,
  PackageIcon,
  ParkingIcon,
  PlateIcon,
  TrendUpIcon,
} from "./icons";
import { SeasonalChart } from "./SeasonalChart";
import type { Garden } from "@/types";

function formatNumber(n: number) {
  return Math.round(n).toLocaleString();
}

function formatCurrency(n: number) {
  const round = (v: number) => Math.round(v / 5) * 5;
  return `$${round(n).toLocaleString()}`;
}

// One hue, stepping darker per card — a small sequential ramp rather than a
// different color per metric, to stay inside the brand's green theme.
const STAT_CHIPS = [
  "bg-sprout-500",
  "bg-sprout-600",
  "bg-amber-500",
  "bg-sprout-700",
] as const;

function StatCard({
  shade,
  icon,
  value,
  unit,
  label,
  changePct,
}: {
  shade: 0 | 1 | 2 | 3;
  icon: React.ReactNode;
  value: string;
  unit?: string;
  label: string;
  changePct: number;
}) {
  return (
    <div className="card">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full text-white ${STAT_CHIPS[shade]}`}
      >
        <div className="h-5 w-5">{icon}</div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">
        {value}
        {unit && (
          <span className="ml-1.5 text-sm font-medium text-slate-500">
            {unit}
          </span>
        )}
      </p>
      <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-sprout-600">
        <TrendUpIcon className="h-3 w-3" />
        {changePct}% vs last season
      </p>
    </div>
  );
}

function GardenBarRow({
  garden,
  maxKg,
}: {
  garden: GardenImpact;
  maxKg: number;
}) {
  const [active, setActive] = useState(false);
  const pct = maxKg > 0 ? Math.max((garden.yieldMidKg / maxKg) * 100, 4) : 0;

  return (
    <div
      className="relative py-1.5"
      tabIndex={0}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      {active && (
        <div className="pointer-events-none absolute -top-1 left-0 z-10 -translate-y-full whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg">
          {Math.round(garden.yieldMinKg)}–{Math.round(garden.yieldMaxKg)} kg
          estimated · {Math.round(garden.areaM2)} m²
        </div>
      )}
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate font-medium text-slate-700">
          {garden.name}
        </span>
        <span className="shrink-0 text-slate-500">
          {Math.round(garden.yieldMidKg)} kg
        </span>
      </div>
      <div className="mt-1.5 h-2.5 w-full bg-slate-100">
        <div
          className="h-2.5 rounded-r-[4px] bg-sprout-500 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EquivalenceRow({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sprout-50 text-sprout-700">
        <div className="h-4 w-4">{icon}</div>
      </div>
      <p className="text-sm leading-relaxed text-slate-600">
        <span className="font-semibold text-slate-900">{value}</span>{" "}
        {label}
      </p>
    </div>
  );
}

export function ImpactSummary({ gardens }: { gardens: Garden[] }) {
  if (gardens.length === 0) return null;

  const impact = estimateImpact(gardens);
  const maxKg = impact.byGarden[0]?.yieldMidKg ?? 0;
  const showByGarden = impact.byGarden.length > 1;

  return (
    <section className="mt-8 lg:mt-10">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        <StatCard
          shade={0}
          icon={<LeafIcon className="h-full w-full" />}
          value={formatNumber(impact.yieldMidKg)}
          unit="kg"
          label="Food grown this season"
          changePct={18}
        />
        <StatCard
          shade={1}
          icon={<CloudIcon className="h-full w-full" />}
          value={formatNumber(impact.co2MidKg)}
          unit="kg CO2e"
          label="Emissions avoided"
          changePct={24}
        />
        <StatCard
          shade={2}
          icon={<CoinIcon className="h-full w-full" />}
          value={formatCurrency((impact.savingsMin + impact.savingsMax) / 2)}
          label="Estimated grocery savings"
          changePct={15}
        />
        <StatCard
          shade={3}
          icon={<PackageIcon className="h-full w-full" />}
          value={formatNumber((impact.packagesMin + impact.packagesMax) / 2)}
          label="Single-use packages avoided"
          changePct={21}
        />
      </div>

      <div
        className={`mt-4 grid gap-4 lg:gap-5 ${showByGarden ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}
      >
        {showByGarden && (
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-900">
              Impact by garden
            </h3>
            <div className="mt-5 flex flex-col divide-y divide-slate-50">
              {impact.byGarden.map((g) => (
                <GardenBarRow key={g.id} garden={g} maxKg={maxKg} />
              ))}
            </div>
          </div>
        )}

        <SeasonalChart />

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900">
            That's about the same as
          </h3>
          <div className="mt-5 flex flex-col gap-4">
            <EquivalenceRow
              icon={<CarIcon className="h-full w-full" />}
              value={`~${Math.round(impact.milesNotDriven).toLocaleString()} miles`}
              label="not driven, from the CO2 avoided"
            />
            <EquivalenceRow
              icon={<PlateIcon className="h-full w-full" />}
              value={`~${Math.round(impact.servings).toLocaleString()}`}
              label="servings of fresh vegetables"
            />
            <EquivalenceRow
              icon={<ParkingIcon className="h-full w-full" />}
              value={`~${Math.max(impact.parkingSpaces, 0.1).toFixed(1)}`}
              label="standard parking spaces of growing space"
            />
          </div>
        </div>
      </div>

      <details className="group mt-6">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-semibold text-sprout-700 hover:text-sprout-800 [&::-webkit-details-marker]:hidden">
          How we estimate this
          <svg
            viewBox="0 0 16 16"
            className="h-3 w-3 shrink-0 transition group-open:rotate-180"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 6.5L8 10.5L12 6.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          Sprout doesn't track actual harvests yet, so these numbers are
          estimated from your planted area using typical home-garden yields
          (about 2.5-4.8 kg of produce per m² per season), the emissions and
          packaging a store-bought equivalent avoids, a blended grocery price
          for common vegetables, and the EPA's average passenger-vehicle
          emissions per mile. Actual results depend on your crop choices,
          care, and weather.
        </p>
      </details>
    </section>
  );
}
