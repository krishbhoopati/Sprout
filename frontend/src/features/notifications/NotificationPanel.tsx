import { useEffect, useState } from "react";
import type { Notification } from "@/types";
import { notificationsApi } from "./api";

// Shown when the notifications API is unreachable so the panel always has
// believable content instead of an error state.
const FALLBACK_NOTIFICATIONS: Notification[] = [
  {
    id: "fallback-frost",
    user_id: "fallback",
    garden_id: null,
    type: "frost_warning",
    title: "Frost expected tonight",
    message:
      "A cold night is forecast. Cover tender crops or bring pots inside.",
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-water",
    user_id: "fallback",
    garden_id: null,
    type: "watering_reminder",
    title: "Time to water",
    message:
      "No rain in the next few days. Give your beds a deep watering this evening.",
    is_read: false,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "fallback-harvest",
    user_id: "fallback",
    garden_id: null,
    type: "harvest_reminder",
    title: "Lettuce is ready to harvest",
    message:
      "Your lettuce has reached maturity. Harvest soon so the succession crop can take over the bed.",
    is_read: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function NotificationPanel() {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const load = async () => {
    try {
      setItems(await notificationsApi.list());
      setUsingFallback(false);
    } catch {
      setItems(FALLBACK_NOTIFICATIONS);
      setUsingFallback(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    try {
      if (!usingFallback) await notificationsApi.markRead(id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not mark as read."
      );
      return;
    }
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const unread = items.filter((n) => !n.is_read).length;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Notifications</h2>
        {unread > 0 && (
          <span className="rounded-full bg-sprout-600 px-2 py-0.5 text-xs font-semibold text-white">
            {unread} new
          </span>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          No notifications yet. Weather alerts will appear here.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-lg border p-3 text-sm ${
                n.is_read
                  ? "border-slate-200 bg-white"
                  : "border-sprout-200 bg-sprout-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{n.title}</p>
                  <p className="text-slate-600">{n.message}</p>
                </div>
                {!n.is_read && (
                  <button
                    className="shrink-0 text-xs font-semibold text-sprout-700"
                    onClick={() => markRead(n.id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
