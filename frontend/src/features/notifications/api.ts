import { supabase } from "@/lib/supabase";
import type { Notification } from "@/types";

// Notifications are read directly from Supabase via RLS (see IMPLEMENTATION.md §5).
export const notificationsApi = {
  async list(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Notification[];
  },

  async markRead(id: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) throw error;
  },
};
