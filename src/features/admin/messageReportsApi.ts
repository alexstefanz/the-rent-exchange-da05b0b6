import { supabase } from "@/integrations/supabase/client";

export type ReportCategory =
  | "inappropriate_language"
  | "harassment"
  | "threats"
  | "fraud"
  | "spam"
  | "other";

export type ReportAction = "none" | "warning" | "message_hidden" | "user_banned";

export interface MessageReportRow {
  id: string;
  public_id: string | null;
  category: ReportCategory;
  reason: string | null;
  resolved: boolean;
  action_taken: ReportAction;
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  message_id: string | null;
  reporter_id: string;
  // joined
  message_content: string | null;
  message_created_at: string | null;
  message_is_hidden: boolean | null;
  conversation_id: string | null;
  author_id: string | null;
  author_name: string | null;
  author_email: string | null;
  reporter_name: string | null;
}

export async function listMessageReports(opts: {
  status?: "open" | "resolved" | "all";
  limit?: number;
} = {}): Promise<MessageReportRow[]> {
  const { status = "open", limit = 100 } = opts;
  let query = supabase
    .from("message_reports")
    .select(`
      id, public_id, category, reason, resolved, action_taken, admin_notes,
      resolved_at, created_at, message_id, reporter_id,
      message:messages!message_reports_message_id_fkey (
        id, content, created_at, is_hidden, conversation_id, sender_id
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status === "open") query = query.eq("resolved", false);
  else if (status === "resolved") query = query.eq("resolved", true);

  let reports: any[] = [];
  const { data, error } = await query;

  if (error) {
    // Fallback if FK alias is unavailable: fetch reports + messages separately
    const fallback = await supabase
      .from("message_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (fallback.error) throw fallback.error;
    const raw = (fallback.data || []).filter((r: any) =>
      status === "open" ? !r.resolved : status === "resolved" ? r.resolved : true
    );
    const messageIds = raw.map((r: any) => r.message_id).filter(Boolean);
    const { data: messages } = messageIds.length
      ? await supabase
          .from("messages")
          .select("id, content, created_at, is_hidden, conversation_id, sender_id")
          .in("id", messageIds)
      : { data: [] as any[] };
    const msgMap = new Map((messages || []).map((m: any) => [m.id, m]));
    reports = raw.map((r: any) => ({ ...r, message: r.message_id ? msgMap.get(r.message_id) ?? null : null }));
  } else {
    reports = data || [];
  }

  // Try to recover conversation_id from `reason` for conversation-level reports
  // (current shape: "Conversation <uuid>")
  const convoFromReason = (reason: string | null): string | null => {
    if (!reason) return null;
    const m = reason.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    return m ? m[0] : null;
  };

  // Hydrate profiles for reporters and message authors
  const reporterIds = Array.from(new Set(reports.map((r: any) => r.reporter_id).filter(Boolean)));
  const authorIds = Array.from(
    new Set(reports.map((r: any) => r.message?.sender_id).filter(Boolean))
  );
  const allProfileIds = Array.from(new Set([...reporterIds, ...authorIds]));

  const { data: profiles } = allProfileIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", allProfileIds)
    : { data: [] as any[] };
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  return reports.map((r: any) => {
    const m = r.message ?? null;
    const author = m?.sender_id ? profileMap.get(m.sender_id) : null;
    const reporter = profileMap.get(r.reporter_id);
    return {
      id: r.id,
      public_id: r.public_id,
      category: r.category,
      reason: r.reason,
      resolved: r.resolved,
      action_taken: r.action_taken || "none",
      admin_notes: r.admin_notes,
      resolved_at: r.resolved_at,
      created_at: r.created_at,
      message_id: r.message_id,
      reporter_id: r.reporter_id,
      message_content: m?.content ?? null,
      message_created_at: m?.created_at ?? null,
      message_is_hidden: m?.is_hidden ?? null,
      conversation_id: m?.conversation_id ?? convoFromReason(r.reason),
      author_id: m?.sender_id ?? null,
      author_name: author?.full_name ?? null,
      author_email: author?.email ?? null,
      reporter_name: reporter?.full_name ?? null,
    } as MessageReportRow;
  });
}

export async function hideMessage(messageId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("messages")
    .update({ is_hidden: true, hidden_at: new Date().toISOString(), hidden_by: user?.id })
    .eq("id", messageId);
  if (error) console.error("hideMessage", error);
  return !error;
}

export async function resolveReport(
  id: string,
  payload: { action_taken: ReportAction; admin_notes?: string }
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("message_reports")
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: user?.id,
      action_taken: payload.action_taken,
      admin_notes: payload.admin_notes ?? null,
    })
    .eq("id", id);
  if (error) console.error("resolveReport", error);
  return !error;
}

export async function banIdentifier(input: { type: "email" | "phone"; value: string; reason?: string }): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("banned_identifiers")
    .insert({ identifier_type: input.type, value: input.value.trim().toLowerCase(), reason: input.reason ?? null, banned_by: user?.id });
  if (error && (error as any).code !== "23505") {
    console.error("banIdentifier", error);
    return false;
  }
  return true;
}

export const CATEGORY_LABELS_RO: Record<ReportCategory, string> = {
  inappropriate_language: "Limbaj licențios",
  harassment: "Hărțuire",
  threats: "Amenințări",
  fraud: "Fraudă",
  spam: "Spam",
  other: "Altceva",
};

export const CATEGORY_COLORS: Record<ReportCategory, string> = {
  inappropriate_language: "bg-orange-100 text-orange-800 border-orange-200",
  harassment: "bg-red-100 text-red-800 border-red-200",
  threats: "bg-red-200 text-red-900 border-red-300",
  fraud: "bg-purple-100 text-purple-800 border-purple-200",
  spam: "bg-blue-100 text-blue-800 border-blue-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
};
