import { useState } from "react";

interface Point {
  month: string;
  kg: number;
}

// Historical seasonal tracking isn't wired up to the backend yet, so this
// illustrates the shape of the trend rather than measured data.
const POINTS: Point[] = [
  { month: "Mar", kg: 40 },
  { month: "Apr", kg: 120 },
  { month: "May", kg: 236 },
  { month: "Jun", kg: 210 },
  { month: "Jul", kg: 310 },
];

const WIDTH = 320;
const HEIGHT = 160;
const PAD_LEFT = 36;
const PAD_BOTTOM = 22;
const MAX_KG = 400;

function coords() {
  const usableW = WIDTH - PAD_LEFT;
  const usableH = HEIGHT - PAD_BOTTOM;
  return POINTS.map((p, i) => ({
    ...p,
    x: PAD_LEFT + (i / (POINTS.length - 1)) * usableW,
    y: usableH - (p.kg / MAX_KG) * usableH,
  }));
}

export function SeasonalChart() {
  const pts = coords();
  const [hover, setHover] = useState<number | null>(2);

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${HEIGHT - PAD_BOTTOM} L${pts[0].x},${HEIGHT - PAD_BOTTOM} Z`;
  const gridValues = [0, 100, 200, 300, 400];
  const usableH = HEIGHT - PAD_BOTTOM;

  const active = hover !== null ? pts[hover] : null;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Seasonal impact trend</h3>
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600"
        >
          This season
        </button>
      </div>

      <div className="relative mt-4">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Seasonal impact trend chart">
          <defs>
            <linearGradient id="seasonal-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#72ab43" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#72ab43" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridValues.map((v) => {
            const y = usableH - (v / MAX_KG) * usableH;
            return (
              <g key={v}>
                <line x1={PAD_LEFT} x2={WIDTH} y1={y} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={PAD_LEFT - 8} y={y + 3} textAnchor="end" className="fill-slate-400" fontSize="9">
                  {v} kg
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#seasonal-fill)" />
          <path d={linePath} fill="none" stroke="#548f28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {pts.map((p, i) => (
            <circle
              key={p.month}
              cx={p.x}
              cy={p.y}
              r={i === hover ? 4 : 3}
              fill="#548f28"
              stroke="white"
              strokeWidth="1.5"
              onMouseEnter={() => setHover(i)}
              className="cursor-pointer"
            />
          ))}

          {pts.map((p) => (
            <text key={p.month} x={p.x} y={HEIGHT - 6} textAnchor="middle" className="fill-slate-400" fontSize="9">
              {p.month}
            </text>
          ))}
        </svg>

        {active && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
            style={{ left: `${(active.x / WIDTH) * 100}%`, top: `${(active.y / HEIGHT) * 100}%` }}
          >
            {active.month}
            <br />
            {active.kg} kg
          </div>
        )}
      </div>
    </div>
  );
}
