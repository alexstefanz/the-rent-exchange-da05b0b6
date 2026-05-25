import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCheck, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/hooks/queries/useNotifications";
import type { Notification } from "@/features/profile/notificationsApi";
import { categorize } from "@/lib/notificationCategory";
import { NotificationFilters, type FilterValue, type ReadFilterValue } from "./NotificationFilters";
import { NotificationGroups } from "./NotificationGroup";
import { NotificationEmpty } from "./NotificationEmpty";
import { NotificationSkeleton } from "./NotificationSkeleton";
import { NotificationSettingsSheet } from "./NotificationSettingsSheet";

function mapLink(link: string, type?: string) {
  if (type === "kyc_approved") return "/owner/new-product";
  if (type === "new_message" || (type ?? "").includes("message")) {
    if (link && link.startsWith("/mesaje")) return link;
    return "/mesaje";
  }
  if (link.includes("?tab=lendings")) return "/anunturi";
  if (link.includes("?tab=rentals")) return "/rezervari";
  if (link.includes("#anunturi") || link === "/profile#anunturi") return "/anunturi";
  if (link.startsWith("/cereri") || link.includes("#cereri") || link === "/profile#cereri") return "/rezervari";
  if (link.includes("#rezervari") || link === "/profile#rezervari") return "/rezervari";
  if (link.includes("#notificari") || link === "/profile#notificari") return "/notificari";
  return link;
}

interface Props {
  /** "popover" = compact (desktop dropdown), "sheet" = full mobile, "page" = standalone /notificari page. */
  variant?: "popover" | "sheet" | "page";
  onClose?: () => void;
}

export function NotificationCenter({ variant = "popover", onClose }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications(user?.id);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [readFilter, setReadFilter] = useState<ReadFilterValue>("unread");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const readCounts = useMemo(
    () => ({
      all: notifications.length,
      unread: notifications.filter((n) => !n.is_read).length,
      read: notifications.filter((n) => n.is_read).length,
    }),
    [notifications],
  );

  const visibleNotifications = useMemo(() => {
    if (readFilter === "unread") return notifications.filter((n) => !n.is_read);
    if (readFilter === "read") return notifications.filter((n) => n.is_read);
    return notifications;
  }, [notifications, readFilter]);

  const counts = useMemo(() => {
    const c: Record<FilterValue, number> = {
      all: 0,
      reservation: 0,
      message: 0,
      payment: 0,
      support: 0,
      system: 0,
      success: 0,
      urgent: 0,
    };
    c.all = visibleNotifications.length;
    for (const n of visibleNotifications) {
      const cat = categorize(n.type);
      c[cat] = (c[cat] ?? 0) + 1;
    }
    return c;
  }, [visibleNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return visibleNotifications;
    return visibleNotifications.filter((n) => categorize(n.type) === filter);
  }, [visibleNotifications, filter]);

  const handleSelect = (n: Notification) => {
    const target = mapLink(n.link || "", n.type);
    if (target) {
      navigate(target);
      onClose?.();
    }
  };

  // Layout sizing per variant
  const containerClass = {
    popover: "flex flex-col h-[min(640px,80vh)] w-full",
    sheet: "flex flex-col h-full w-full",
    page: "flex flex-col w-full",
  }[variant];

  const bodyClass = {
    popover: "flex-1 overflow-y-auto overscroll-contain",
    sheet: "flex-1 overflow-y-auto overscroll-contain",
    page: "min-h-[300px]",
  }[variant];

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className={`px-5 pt-4 pb-2 shrink-0 ${variant === "sheet" ? "pr-14 relative" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-lg font-bold tracking-tight">
              {t("Notificări", "Notifications")}
            </h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {unreadCount > 0
                ? t(
                    `Ai ${unreadCount} ${unreadCount === 1 ? "notificare nouă" : "notificări noi"}`,
                    `You have ${unreadCount} new notification${unreadCount === 1 ? "" : "s"}`,
                  )
                : t("Ești la zi", "You're all caught up")}
            </p>
          </div>
          <div
            className={`flex items-center gap-1 shrink-0 ${
              variant === "sheet"
                ? "absolute top-3 right-14 h-8"
                : ""
            }`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setSettingsOpen(true)}
              title={t("Setări notificări", "Notification settings")}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-[11px] font-semibold text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                {t("Citește toate", "Read all")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="shrink-0 pt-1">
        <NotificationFilters
          value={filter}
          onChange={setFilter}
          counts={counts}
          readFilter={readFilter}
          onReadChange={setReadFilter}
          readCounts={readCounts}
        />
      </div>

      {/* Body */}
      <div className={bodyClass}>
        {isLoading ? (
          <NotificationSkeleton />
        ) : filtered.length === 0 ? (
          <NotificationEmpty
            variant={notifications.length === 0 ? "all" : "filtered"}
            onAction={onClose}
          />
        ) : (
          <NotificationGroups
            notifications={filtered}
            onSelect={handleSelect}
            onMarkRead={markAsRead}
          />
        )}
      </div>

      {/* Footer */}
      {variant !== "page" && (
        <div className="shrink-0 p-3 border-t border-border/70">
          <Link
            to="/notificari"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            {t("Vezi toate notificările", "View all notifications")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <NotificationSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}