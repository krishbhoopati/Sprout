import { useEffect, useState } from "react";
import type { Notification } from "@/types";
import { notificationsApi } from "./api";
import { isSupabaseConfigured } from "@/lib/supabase";

export function NotificationPanel() {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!isSupabaseConfigured) return;
    try {
      setItems(await notificationsApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id);
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
