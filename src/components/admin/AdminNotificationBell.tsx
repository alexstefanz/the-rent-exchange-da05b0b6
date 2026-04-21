import { useState, useEffect } from "react";
import { Bell, Shield, Package, Ticket, Banknote, UserPlus, ArrowLeft, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdminNotifications } from "@/hooks/queries/useAdminNotifications";
import {
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  type AdminNotification,
} from "@/features/admin/adminNotificationsApi";

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

const AdminNotificationBell = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const qc = useQueryClient();
  const { data: notifications = [] } = useAdminNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [mobileOpen, setMobileOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filtered = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  const formatTime = (d: string) =>
    formatDistanceToNow(new Date(d), { addSuffix: true, locale: ro });

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
    if (n.link) {
      if (isMobile) setMobileOpen(false);
      navigate(n.link);
    }
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

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const renderItem = (n: AdminNotification) => (
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
        <p
          className={`text-sm leading-snug ${
            !n.is_read ? "font-semibold" : "font-normal text-muted-foreground"
          }`}
        >
          {n.title_ro}
          {n.priority === "high" && (
            <span className="ml-2 inline-block text-[10px] font-bold uppercase text-destructive">
              Urgent
            </span>
          )}
        </p>
        {n.description_ro && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.description_ro}</p>
        )}
        <span
          className={`text-xs mt-0.5 block ${
            !n.is_read ? "text-primary font-medium" : "text-muted-foreground/60"
          }`}
        >
          {formatTime(n.created_at)}
        </span>
      </div>
      {!n.is_read && (
        <div className="flex-shrink-0 mt-2">
          <span className="block h-2.5 w-2.5 rounded-full bg-primary" />
        </div>
      )}
    </button>
  );

  const trigger = (
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <>
        <div onClick={() => setMobileOpen(true)}>{trigger}</div>
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] bg-background" style={{ height: "100dvh" }}>
            <div className="flex flex-col h-full bg-background">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileOpen(false)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-bold flex-1">Notificări admin</h2>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs text-primary h-8 px-2" onClick={handleMarkAllRead}>
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Citește toate
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 px-4 py-3 shrink-0">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filter === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Toate
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filter === "unread" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Necitite
                </button>
              </div>
              <div className="flex-1 overflow-y-auto bg-background">
                {filtered.length > 0 ? (
                  filtered.map(renderItem)
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Bell className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">Nu ai notificări {filter === "unread" ? "necitite" : "noi"}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0 bg-background border border-border shadow-lg rounded-xl">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <h3 className="text-base font-bold">Notificări admin</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-primary h-7 px-2" onClick={handleMarkAllRead}>
              Citește toate
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 px-4 pb-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Toate
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === "unread" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Necitite ({unreadCount})
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map(renderItem)
          ) : (
            <div className="px-4 py-12 text-sm text-muted-foreground text-center">
              Nu ai notificări {filter === "unread" ? "necitite" : "noi"}
            </div>
          )}
        </div>
        <div className="border-t border-border">
          <Link
            to="/admin/notifications"
            className="block w-full text-center text-sm font-medium text-primary py-3 hover:bg-muted/50 transition-colors"
          >
            Vezi toate notificările
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminNotificationBell;