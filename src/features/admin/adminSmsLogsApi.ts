import { supabase } from "@/integrations/supabase/client";

export interface AdminSmsLog {
  id: string;
  created_at: string;
  user_id: string | null;
  user_name: string;
  user_email: string;
  rental_id: string | null;
  product_title: string;
  recipient_phone: string;
  template_key: string;
  message_body: string;
  status: "sent" | "failed" | "skipped";
  provider_message_id: string | null;
  provider_response: Record<string, unknown> | null;
  error_message: string | null;
  idempotency_key: string;
}

export interface AdminSmsLogFilters {
  status?: "sent" | "failed" | "skipped";
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export const getAdminSmsLogs = async (
  filters: AdminSmsLogFilters = {},
): Promise<AdminSmsLog[]> => {
  const { data, error } = await supabase.rpc("get_admin_sms_logs" as never, {
    status_filter: filters.status ?? null,
    search_query: filters.search?.trim() || null,
    date_from: filters.dateFrom ? filters.dateFrom.toISOString() : null,
    date_to: filters.dateTo ? filters.dateTo.toISOString() : null,
    limit_count: filters.limit ?? 100,
    offset_count: filters.offset ?? 0,
  } as never);

  if (error) {
    console.error("[getAdminSmsLogs] error:", error);
    throw error;
  }
  return (data || []) as AdminSmsLog[];
};

export interface AdminSmsLogsStats {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  uniqueRecipients: number;
}

/**
 * Aggregates client-side from a fetched batch — sufficient for dashboard KPIs
 * without adding a second RPC. Caller passes the same filtered list it displays.
 */
export const computeSmsLogsStats = (logs: AdminSmsLog[]): AdminSmsLogsStats => {
  const phones = new Set<string>();
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const l of logs) {
    if (l.recipient_phone) phones.add(l.recipient_phone);
    if (l.status === "sent") sent++;
    else if (l.status === "failed") failed++;
    else if (l.status === "skipped") skipped++;
  }
  return {
    total: logs.length,
    sent,
    failed,
    skipped,
    uniqueRecipients: phones.size,
  };
};