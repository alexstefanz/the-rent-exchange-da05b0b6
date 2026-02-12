import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title_ro: string;
  title_en: string | null;
  description_ro: string | null;
  description_en: string | null;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data as Notification[]) || [];
};

export const getUnreadCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) throw error;
  return count || 0;
};

export const markAsRead = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) throw error;
};

export const markAllAsRead = async (): Promise<void> => {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);

  if (error) throw error;
};
