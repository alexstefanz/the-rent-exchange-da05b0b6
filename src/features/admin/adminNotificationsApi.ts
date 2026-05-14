import { supabase } from "@/integrations/supabase/client";

export interface AdminNotification {
  id: string;
  type: string;
  title_ro: string;
  title_en: string | null;
  description_ro: string | null;
  description_en: string | null;
  link: string | null;
  entity_id: string | null;
  entity_type: string | null;
  priority: "low" | "normal" | "high";
  is_read: boolean;
  created_at: string;
}

export interface AdminNotificationSummary {
  unread_total: number;
  pending_kyc: number;
  pending_products: number;
  open_tickets: number;
  pending_withdrawals: number;
  unread_high_priority: number;
  pending_cancellations: number;
}

export async function getAdminNotifications(limit = 50): Promise<AdminNotification[]> {
  const { data, error } = await supabase
    .from("admin_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as AdminNotification[];
}

export async function getAdminUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from("admin_notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);
  if (error) throw error;
  return count || 0;
}

export async function markAdminNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("admin_notifications")
    .update({ is_read: true })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  const { error } = await supabase
    .from("admin_notifications")
    .update({ is_read: true })
    .eq("is_read", false);
  if (error) throw error;
}

export async function getAdminNotificationSummary(): Promise<AdminNotificationSummary> {
  const { data, error } = await supabase.rpc("get_admin_notification_summary");
  if (error) throw error;
  const row = (data || [])[0];
  return {
    unread_total: Number(row?.unread_total || 0),
    pending_kyc: Number(row?.pending_kyc || 0),
    pending_products: Number(row?.pending_products || 0),
    open_tickets: Number(row?.open_tickets || 0),
    pending_withdrawals: Number(row?.pending_withdrawals || 0),
    unread_high_priority: Number(row?.unread_high_priority || 0),
    pending_cancellations: Number(row?.pending_cancellations || 0),
  };
}