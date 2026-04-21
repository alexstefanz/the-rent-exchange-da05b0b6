import { useState } from "react";
import { Bell, Shield, Package, Ticket, Banknote, UserPlus, CheckCheck } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
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
  kyc_submitted: "KYC trimis",
  kyc_needs_review: "KYC necesită revizuire",
  product_pending: "Produs în așteptare",
  ticket_opened: "Ticket nou",
  ticket_message: "Mesaj ticket",
  withdrawal_requested: "Cerere retragere",
  new_user_signup: "Înregistrare nouă",
};

const getIcon = (type: string) => {
  switch (type) {
    case "kyc_submitted":
    case "kyc_needs_review":
      return <Shield className="h-5 w-5 text-blue-500" />;
    case "product_pending":
      return <Package className="h-5 w-5 text-orange-500" />;
    case "ticket_opened":
    case "ticket_message":
      return <Ticket className="h-5 w-5 text-purple-500" />;
    case "withdrawal_requested":
      return <Banknote className="h-5 w-5 text-green-600" />;
    case "new_user_signup":
      return <UserPlus className="h-5 w-5 text-muted-foreground" />;
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

  const filtered = notifications.filter((n) => {
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (readFilter === "unread" && n.is_read) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const types = Array.from(new Set(notifications.map((n) => n.type)));

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

        <Card>
          <CardHeader className="p-4 md:p-6 pb-3">
            <CardTitle className="text-base">Filtre</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setReadFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  readFilter === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Toate
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
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  typeFilter === "all" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                Toate tipurile
              </button>
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    typeFilter === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {TYPE_LABELS[t] || t}
                </button>
              ))}
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
                Nu există notificări care să corespundă filtrelor.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;