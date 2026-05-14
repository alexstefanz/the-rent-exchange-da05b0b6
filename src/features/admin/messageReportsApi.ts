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
  reporter_email: string | null;
  // Reported user (resolved from reported_user_id, message author, or other conversation participant)
  reported_user_id: string | null;
  reported_user_name: string | null;
  reported_user_email: string | null;
  // Conversation participants (when available)
  buyer_id: string | null;
  buyer_name: string | null;
  owner_id: string | null;
  owner_name: string | null;
  // Cleaned reason (legacy "Conversation <uuid>" reasons are stripped)
  reason_clean: string | null;
  recent_messages?: { id: string; content: string; sender_id: string | null; sender_name: string | null; created_at: string; is_hidden: boolean }[];
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
      resolved_at, created_at, message_id, reporter_id, conversation_id, reported_user_id,
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

  // Compute the effective conversation id per report (column → joined message → null)
  const convoIdOf = (r: any): string | null =>
    r.conversation_id ?? r.message?.conversation_id ?? null;

  // Fetch conversation participants for any report tied to a conversation
  const allConvoIds = Array.from(
    new Set(reports.map((r: any) => convoIdOf(r)).filter(Boolean) as string[])
  );
  const convoMap = new Map<string, { buyer_id: string; owner_id: string }>();
  if (allConvoIds.length) {
    const { data: convos } = await supabase
      .from("conversations")
      .select("id, buyer_id, owner_id")
      .in("id", allConvoIds);
    for (const c of convos || []) {
      convoMap.set((c as any).id, { buyer_id: (c as any).buyer_id, owner_id: (c as any).owner_id });
    }
  }

  // Fetch the latest few messages for conversation-level reports (no specific message)
  const convoOnlyIds = Array.from(
    new Set(
      reports
        .filter((r: any) => !r.message_id && convoIdOf(r))
        .map((r: any) => convoIdOf(r) as string)
    )
  );
  const recentByConvo = new Map<string, MessageReportRow["recent_messages"]>();
  if (convoOnlyIds.length) {
    const { data: recents } = await supabase
      .from("messages")
      .select("id, content, sender_id, created_at, is_hidden, conversation_id")
      .in("conversation_id", convoOnlyIds)
      .order("created_at", { ascending: false })
      .limit(convoOnlyIds.length * 5);
    for (const row of recents || []) {
      const arr = recentByConvo.get((row as any).conversation_id) ?? [];
      if (arr.length < 5) {
        arr.push({
          id: (row as any).id,
          content: (row as any).content,
          sender_id: (row as any).sender_id,
          sender_name: null,
          created_at: (row as any).created_at,
          is_hidden: (row as any).is_hidden,
        });
        recentByConvo.set((row as any).conversation_id, arr);
      }
    }
    // Reverse to chronological order per convo
    for (const [k, v] of recentByConvo) recentByConvo.set(k, [...(v || [])].reverse());
  }

  // Resolve reported_user_id per report (column → message author → other convo participant)
  const resolvedReportedUserId = (r: any): string | null => {
    if (r.reported_user_id) return r.reported_user_id;
    if (r.message?.sender_id) return r.message.sender_id;
    const convoId = convoIdOf(r);
    if (convoId) {
      const c = convoMap.get(convoId);
      if (c) {
        if (c.buyer_id === r.reporter_id) return c.owner_id;
        if (c.owner_id === r.reporter_id) return c.buyer_id;
      }
    }
    return null;
  };

  // Hydrate profiles for reporters, reported users, message authors, and convo participants
  const reporterIds = Array.from(new Set(reports.map((r: any) => r.reporter_id).filter(Boolean)));
  const authorIds = Array.from(new Set(reports.map((r: any) => r.message?.sender_id).filter(Boolean)));
  const reportedIds = Array.from(new Set(reports.map((r: any) => resolvedReportedUserId(r)).filter(Boolean) as string[]));
  const participantIds = Array.from(
    new Set(
      Array.from(convoMap.values()).flatMap((c) => [c.buyer_id, c.owner_id]).filter(Boolean) as string[]
    )
  );
  const recentSenderIds = Array.from(
    new Set(
      Array.from(recentByConvo.values())
        .flat()
        .map((m) => m?.sender_id)
        .filter(Boolean) as string[]
    )
  );
  const allProfileIds = Array.from(new Set([...reporterIds, ...authorIds, ...reportedIds, ...participantIds, ...recentSenderIds]));

  const { data: profiles } = allProfileIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", allProfileIds)
    : { data: [] as any[] };
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  // Fill in sender_name on recent messages now that profiles are loaded
  for (const [k, arr] of recentByConvo) {
    recentByConvo.set(
      k,
      (arr || []).map((m) => ({
        ...m,
        sender_name: m.sender_id ? (profileMap.get(m.sender_id)?.full_name ?? null) : null,
      }))
    );
  }

  const cleanReason = (raw: string | null): string | null => {
    if (!raw) return null;
    // Legacy reports stored "Conversation <uuid>" in reason — hide that as it's not a real motive.
    if (/^Conversation\s+[0-9a-f-]{36}$/i.test(raw.trim())) return null;
    return raw;
  };

  return reports.map((r: any) => {
    const m = r.message ?? null;
    const author = m?.sender_id ? profileMap.get(m.sender_id) : null;
    const reporter = profileMap.get(r.reporter_id);
    const convoId = convoIdOf(r);
    const convo = convoId ? convoMap.get(convoId) : null;
    const reportedId = resolvedReportedUserId(r);
    const reported = reportedId ? profileMap.get(reportedId) : null;
    const buyerProfile = convo?.buyer_id ? profileMap.get(convo.buyer_id) : null;
    const ownerProfile = convo?.owner_id ? profileMap.get(convo.owner_id) : null;
    return {
      id: r.id,
      public_id: r.public_id,
      category: r.category,
      reason: r.reason,
      reason_clean: cleanReason(r.reason),
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
      conversation_id: convoId,
      author_id: m?.sender_id ?? null,
      author_name: author?.full_name ?? null,
      author_email: author?.email ?? null,
      reporter_name: reporter?.full_name ?? null,
      reporter_email: reporter?.email ?? null,
      reported_user_id: reportedId,
      reported_user_name: reported?.full_name ?? null,
      reported_user_email: reported?.email ?? null,
      buyer_id: convo?.buyer_id ?? null,
      buyer_name: buyerProfile?.full_name ?? null,
      owner_id: convo?.owner_id ?? null,
      owner_name: ownerProfile?.full_name ?? null,
      recent_messages: !r.message_id && convoId ? recentByConvo.get(convoId) ?? [] : undefined,
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

export async function warnUser(input: {
  userId: string;
  reason: string;
  category?: string | null;
  relatedReportId?: string | null;
}): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("user_warnings").insert({
    user_id: input.userId,
    issued_by: user?.id,
    reason: input.reason,
    category: input.category ?? null,
    related_report_id: input.relatedReportId ?? null,
  });
  if (error) {
    console.error("warnUser", error);
    return false;
  }
  // Best-effort in-app notification
  try {
    await supabase.from("notifications").insert({
      user_id: input.userId,
      type: "account_warning",
      title_ro: "Avertizare de la moderare",
      title_en: "Warning from moderation",
      description_ro: input.reason,
      description_en: input.reason,
      link: "/profil/notificari",
    });
  } catch (e) {
    console.warn("warnUser notification insert failed", e);
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
