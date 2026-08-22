import { CloudRainIcon, CloudSunIcon, SunIcon } from "./icons";

interface DayForecast {
  label: string;
  hi: number;
  lo: number;
  icon: "sun" | "cloud-sun" | "rain";
}

// Live weather isn't wired up yet; this mirrors the shape the weather API
// (see WeatherResponse in types) will eventually fill in.
const FORECAST: DayForecast[] = [
  { label: "Today", hi: 22, lo: 12, icon: "sun" },
  { label: "Fri", hi: 21, lo: 11, icon: "cloud-sun" },
  { label: "Sat", hi: 20, lo: 10, icon: "cloud-sun" },
  { label: "Sun", hi: 19, lo: 10, icon: "rain" },
  { label: "Mon", hi: 18, lo: 9, icon: "rain" },
];

function DayIcon({ icon, className }: { icon: DayForecast["icon"]; className?: string }) {
  if (icon === "sun") return <SunIcon className={className} />;
  if (icon === "cloud-sun") return <CloudSunIcon className={className} />;
  return <CloudRainIcon className={className} />;
}

export function WeatherCard() {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Weather today</h2>
        <span className="text-xs text-slate-400">Toronto, ON</span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <SunIcon className="h-10 w-10 text-amber-400" />
        <div>
          <p className="text-3xl font-semibold text-slate-900">22°C</p>
          <p className="text-sm text-slate-500">
            Sunny <span className="text-slate-400">Feels like 24°</span>
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-5 gap-1 border-t border-slate-100 pt-4">
        {FORECAST.map((day) => (
          <div key={day.label} className="flex flex-col items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500">{day.label}</span>
            <DayIcon icon={day.icon} className="h-5 w-5 text-slate-400" />
            <span className="text-xs text-slate-600">
              {day.hi}°<span className="text-slate-400">/{day.lo}°</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
