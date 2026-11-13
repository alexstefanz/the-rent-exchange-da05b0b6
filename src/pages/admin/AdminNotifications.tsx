import { useMemo, useState } from "react";
import {
  Bell, Shield, Package, Ticket, Banknote, UserPlus, CheckCheck,
  AlertTriangle, XCircle, Flag, RefreshCw,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminSmsAlertSettings from "@/components/admin/AdminSmsAlertSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { useAdminNotifications } from "@/hooks/queries/useAdminNotifications";
import {
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  type AdminNotification,
} from "@/features/admin/adminNotificationsApi";

const TYPE_LABELS: Record<string, string> = {
  // Urgent / SLA
  sla_breach: "SLA depășit",
  dispute_opened: "Dispută deschisă",
  cancellation_requested: "Cerere de anulare",
  payout_failed: "Plată eșuată",
  // Moderare
  product_pending: "Produs în așteptare",
  product_reported: "Produs raportat",
  user_reported: "Utilizator raportat",
  // Operațional
  ticket_opened: "Ticket nou",
  ticket_message: "Mesaj ticket",
  withdrawal_requested: "Cerere retragere",
  refund_requested: "Cerere refund",
  cancellation_approved: "Anulare aprobată",
  cancellation_rejected: "Anulare respinsă",
  new_user_signup: "Înregistrare nouă",
};

type CategoryKey = "urgent" | "moderation" | "ops" | "other";

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  urgent: "Urgent / SLA",
  moderation: "Moderare",
  ops: "Operațional",
  other: "Altele",
};

const TYPE_TO_CATEGORY: Record<string, CategoryKey> = {
  sla_breach: "urgent",
  dispute_opened: "urgent",
  cancellation_requested: "urgent",
  payout_failed: "urgent",
  product_pending: "moderation",
  product_reported: "moderation",
  user_reported: "moderation",
  ticket_opened: "ops",
  ticket_message: "ops",
  withdrawal_requested: "ops",
  refund_requested: "ops",
  cancellation_approved: "ops",
  cancellation_rejected: "ops",
  new_user_signup: "ops",
};

const getCategory = (type: string): CategoryKey => TYPE_TO_CATEGORY[type] || "other";

const prettifyType = (type: string) =>
  type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const TYPE_DOT: Record<string, string> = {
  sla_breach: "bg-red-500",
  dispute_opened: "bg-red-500",
  cancellation_requested: "bg-orange-500",
  payout_failed: "bg-red-500",
  product_pending: "bg-orange-500",
  product_reported: "bg-orange-500",
  user_reported: "bg-orange-500",
  ticket_opened: "bg-purple-500",
  ticket_message: "bg-purple-500",
  withdrawal_requested: "bg-green-600",
  refund_requested: "bg-green-600",
  cancellation_approved: "bg-emerald-500",
  cancellation_rejected: "bg-muted-foreground",
  new_user_signup: "bg-muted-foreground",
};

const getIcon = (type: string) => {
  switch (type) {
    case "product_pending":
    case "product_reported":
    case "user_reported":
      return <Package className="h-5 w-5 text-orange-500" />;
    case "ticket_opened":
    case "ticket_message":
      return <Ticket className="h-5 w-5 text-purple-500" />;
    case "withdrawal_requested":
    case "refund_requested":
      return <Banknote className="h-5 w-5 text-green-600" />;
    case "new_user_signup":
      return <UserPlus className="h-5 w-5 text-muted-foreground" />;
    case "sla_breach":
    case "dispute_opened":
    case "payout_failed":
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case "cancellation_requested":
      return <Flag className="h-5 w-5 text-orange-500" />;
    case "cancellation_approved":
      return <RefreshCw className="h-5 w-5 text-emerald-500" />;
    case "cancellation_rejected":
      return <XCircle className="h-5 w-5 text-muted-foreground" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
};

const AdminNotifications = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: notifications = [], isLoading } = useAdminNotifications();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread">("all");
  const [category, setCategory] = useState<CategoryKey | "all">("all");

  const filtered = notifications.filter((n) => {
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (category !== "all" && getCategory(n.type) !== category) return false;
    if (readFilter === "unread" && n.is_read) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const { countsByType, countsByCategory, typesInCategory } = useMemo(() => {
    const cT: Record<string, number> = {};
    const cC: Record<string, number> = { all: notifications.length, urgent: 0, moderation: 0, ops: 0, other: 0 };
    for (const n of notifications) {
      cT[n.type] = (cT[n.type] || 0) + 1;
      cC[getCategory(n.type)] = (cC[getCategory(n.type)] || 0) + 1;
    }
    const allTypes = Object.keys(cT).sort((a, b) => cT[b] - cT[a]);
    const tic: Record<string, string[]> = {
      all: allTypes,
      urgent: allTypes.filter((t) => getCategory(t) === "urgent"),
      moderation: allTypes.filter((t) => getCategory(t) === "moderation"),
      ops: allTypes.filter((t) => getCategory(t) === "ops"),
      other: allTypes.filter((t) => getCategory(t) === "other"),
    };
    return { countsByType: cT, countsByCategory: cC, typesInCategory: tic };
  }, [notifications]);

  const visibleTypes = typesInCategory[category] || [];

  const handleClick = async (n: AdminNotification) => {
    if (!n.is_read) {
      try {
        await markAdminNotificationRead(n.id);
        qc.invalidateQueries({ queryKey: ["admin-notifications"] });
        qc.invalidateQueries({ queryKey: ["admin-notification-summary"] });
      } catch (e) {
        console.error(e);
      }
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAdminNotificationsRead();
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      qc.invalidateQueries({ queryKey: ["admin-notification-summary"] });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Notificări admin</h1>
            <p className="text-sm text-muted-foreground">Inbox partajat — toți adminii văd aceleași evenimente</p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllRead} variant="outline" size="sm">
              <CheckCheck className="h-4 w-4 mr-2" />
              Marchează toate ca citite ({unreadCount})
            </Button>
          )}
        </div>

        <AdminSmsAlertSettings />

        <Card>
          <CardHeader className="p-4 md:p-6 pb-3">
            <CardTitle className="text-base">Filtre</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setReadFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  readFilter === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Toate ({notifications.length})
              </button>
              <button
                onClick={() => setReadFilter("unread")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  readFilter === "unread" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Necitite ({unreadCount})
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 flex-wrap border-b pb-2">
              {([
                { key: "all" as const, label: "Toate categoriile" },
                { key: "urgent" as const, label: CATEGORY_LABELS.urgent },
                { key: "moderation" as const, label: CATEGORY_LABELS.moderation },
                { key: "ops" as const, label: CATEGORY_LABELS.ops },
                ...(countsByCategory.other > 0
                  ? [{ key: "other" as const, label: CATEGORY_LABELS.other }]
                  : []),
              ]).map((cat) => {
                const active = category === cat.key;
                const count = countsByCategory[cat.key] || 0;
                const isUrgent = cat.key === "urgent";
                return (
                  <button
                    key={cat.key}
                    onClick={() => { setCategory(cat.key); setTypeFilter("all"); }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? isUrgent
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {isUrgent && <AlertTriangle className="h-3.5 w-3.5" />}
                    {cat.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      active
                        ? isUrgent ? "bg-destructive/20" : "bg-primary/20"
                        : "bg-muted"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Type chips for the active category */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  typeFilter === "all"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                Toate tipurile
              </button>
              {visibleTypes.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">Niciun tip în această categorie</span>
              ) : (
                visibleTypes.map((t) => {
                  const active = typeFilter === t;
                  const isUrgentType = getCategory(t) === "urgent";
                  return (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? isUrgentType
                            ? "border-destructive/40 bg-destructive/10 text-destructive"
                            : "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${TYPE_DOT[t] || "bg-muted-foreground"}`} />
                      {TYPE_LABELS[t] || prettifyType(t)}
                      <span className="text-[10px] opacity-70">({countsByType[t]})</span>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="divide-y">
                {filtered.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                      !n.is_read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold" : "text-muted-foreground"}`}>
                          {n.title_ro}
                        </p>
                        {n.priority === "high" && (
                          <Badge variant="destructive" className="text-[10px] py-0 h-4">Urgent</Badge>
                        )}
                      </div>
                      {n.description_ro && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.description_ro}</p>
                      )}
                      <span className="text-xs mt-0.5 block text-muted-foreground/60">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ro })}
                      </span>
                    </div>
                    {!n.is_read && (
                      <span className="flex-shrink-0 mt-2 block h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-16 text-sm text-muted-foreground text-center">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                {readFilter === "unread" && typeFilter === "all" && category === "all"
                  ? "Inbox curat 🎉 — nu ai notificări necitite."
                  : typeFilter !== "all"
                  ? `Nu există notificări de tip „${TYPE_LABELS[typeFilter] || prettifyType(typeFilter)}".`
                  : "Nu există notificări care să corespundă filtrelor."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;