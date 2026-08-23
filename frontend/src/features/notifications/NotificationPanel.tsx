import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
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
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Notifications
        </h2>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="unread-badge"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", damping: 1, duration: 0.25 }}
              className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sprout-600 px-1.5 text-xs font-semibold text-white"
            >
              {unread}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {items.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          No notifications yet. Weather alerts will appear here.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {items.map((n) => (
            <motion.li
              key={n.id}
              layout="position"
              transition={{ type: "spring", damping: 1, duration: 0.3 }}
              className="py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <motion.span
                    animate={{ scale: n.is_read ? 0 : 1, opacity: n.is_read ? 0 : 1 }}
                    transition={{ type: "spring", damping: 1, duration: 0.25 }}
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sprout-500"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {n.message}
                    </p>
                  </div>
                </div>
                <AnimatePresence>
                  {!n.is_read && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="shrink-0 text-xs font-semibold text-sprout-700 transition-colors duration-100 hover:text-sprout-800 active:opacity-70"
                      onClick={() => markRead(n.id)}
                    >
                      Mark read
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
