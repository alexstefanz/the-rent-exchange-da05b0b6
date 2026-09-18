import { supabase } from "@/integrations/supabase/client";

export interface AdminActivityRow {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
}

export interface AdminActivityParams {
  search?: string;
  action?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

export const ACTION_LABELS: Record<string, string> = {
  PRODUCT_CREATED: "Anunț creat",
  PRODUCT_DEACTIVATED: "Anunț dezactivat",
  PRODUCT_REACTIVATED: "Anunț reactivat",
  PRODUCT_DELETED: "Anunț șters",
  PRICE_CHANGED: "Preț modificat",
  RENTAL_CREATED: "Rezervare creată",
  RENTAL_CONFIRMED: "Rezervare confirmată",
  RENTAL_CANCELLED: "Rezervare anulată",
  RENTAL_COMPLETED: "Rezervare finalizată",
  RENTAL_REJECTED: "Rezervare respinsă",
  RENTAL_ACTIVE: "Rezervare activă",
  RENTAL_EARLY_RETURN_REQUESTED: "Cerere returnare anticipată",
  PHONE_UPDATED: "Telefon actualizat",
  PASSWORD_RESET_REQUESTED: "Resetare parolă cerută",
};

export const actionLabel = (action: string) => ACTION_LABELS[action] ?? action;

export const actionTone = (action: string): "neutral" | "success" | "danger" | "warning" => {
  if (/CANCELLED|REJECTED|DELETED|DEACTIVATED/.test(action)) return "danger";
  if (/CONFIRMED|COMPLETED|ACTIVE|REACTIVATED|CREATED/.test(action)) return "success";
  if (/CHANGED|UPDATED|REQUESTED/.test(action)) return "warning";
  return "neutral";
};

export interface AdminActivityResult {
  rows: AdminActivityRow[];
  total: number;
  actions: string[];
}

export const fetchAdminActivity = async (
  params: AdminActivityParams
): Promise<AdminActivityResult> => {
  const page = params.page ?? 0;
  const pageSize = params.pageSize ?? 50;

  // Resolve user ids when searching by name/email
  let userIds: string[] | null = null;
  const search = params.search?.trim();
  if (search) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id")
      .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      .limit(500);
    userIds = (profs ?? []).map((p: any) => p.id);
    if (userIds.length === 0) return { rows: [], total: 0, actions: [] };
  }

  let query = supabase
    .from("user_activity_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (userIds) query = query.in("user_id", userIds);
  if (params.action && params.action !== "all") query = query.eq("action", params.action);
  if (params.dateFrom) query = query.gte("created_at", params.dateFrom.toISOString());
  if (params.dateTo) {
    const end = new Date(params.dateTo);
    end.setHours(23, 59, 59, 999);
    query = query.lte("created_at", end.toISOString());
  }

  const { data, error, count } = await query.range(page * pageSize, page * pageSize + pageSize - 1);
  if (error) throw new Error(error.message);

  const logs = (data ?? []) as any[];
  const ids = Array.from(new Set(logs.map((l) => l.user_id).filter(Boolean)));

  let profileMap = new Map<string, { full_name: string | null; email: string | null }>();
  if (ids.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    profileMap = new Map(
      (profiles ?? []).map((p: any) => [p.id, { full_name: p.full_name, email: p.email }])
    );
  }

  const rows: AdminActivityRow[] = logs.map((l) => ({
    id: l.id,
    user_id: l.user_id,
    action: l.action,
    entity_type: l.entity_type,
    entity_id: l.entity_id,
    metadata: l.metadata,
    created_at: l.created_at,
    user_name: profileMap.get(l.user_id)?.full_name ?? null,
    user_email: profileMap.get(l.user_id)?.email ?? null,
  }));

  return { rows, total: count ?? 0, actions: [] };
};

export const fetchAdminActivityActions = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from("user_activity_logs")
    .select("action")
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) throw new Error(error.message);
  return Array.from(new Set((data ?? []).map((r: any) => r.action))).sort();
};

export const activityDetails = (row: AdminActivityRow): string => {
  const m = row.metadata ?? {};
  const candidates = [
    m.title,
    m.product_title,
    m.public_id,
    m.new_status,
    m.reason,
    m.new_price != null ? `preț nou: ${m.new_price} lei` : null,
  ].filter(Boolean);
  return candidates.join(" · ");
};

export const activityToCsv = (rows: AdminActivityRow[]): string => {
  const header = ["Data", "Utilizator", "Email", "Acțiune", "Tip", "Element", "Detalii"];
  const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      new Date(r.created_at).toLocaleString("ro-RO"),
      r.user_name ?? "",
      r.user_email ?? "",
      actionLabel(r.action),
      r.entity_type ?? "",
      r.entity_id ?? "",
      activityDetails(r),
    ]
      .map(esc)
      .join(",")
  );
  return [header.map(esc).join(","), ...lines].join("\n");
};
