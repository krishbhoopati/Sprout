import { ArrowRightIcon, LeafIcon, LogIcon, PlusAddIcon } from "./icons";

interface Activity {
  id: string;
  icon: "add" | "leaf" | "log";
  text: string;
  when: string;
}

// Activity logging isn't wired up to the backend yet; this is illustrative
// content until a real activity feed exists.
const ACTIVITY: Activity[] = [
  { id: "a1", icon: "add", text: "You added 4 Tomato plants to frontyard", when: "2h ago" },
  { id: "a2", icon: "leaf", text: "Harvested Lettuce from backyard", when: "Yesterday" },
  { id: "a3", icon: "log", text: "Logged 5 kg of food harvested", when: "May 12" },
];

function ActivityIcon({ icon, className }: { icon: Activity["icon"]; className?: string }) {
  if (icon === "add") return <PlusAddIcon className={className} />;
  if (icon === "leaf") return <LeafIcon className={className} />;
  return <LogIcon className={className} />;
}

export function ActivityCard() {
  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>

      <ul className="mt-3 divide-y divide-slate-100">
        {ACTIVITY.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
            <ActivityIcon icon={item.icon} className="mt-0.5 h-4 w-4 shrink-0 text-sprout-600" />
            <p className="min-w-0 flex-1 text-sm leading-snug text-slate-600">{item.text}</p>
            <span className="shrink-0 text-xs text-slate-400">{item.when}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sprout-700 transition hover:gap-1.5 hover:text-sprout-800"
      >
        View all activity
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
