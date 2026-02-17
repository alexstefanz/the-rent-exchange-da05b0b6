import { useState, useEffect } from "react";
import { Bell, MessageCircle, Calendar, Eye, CheckCircle2, Send, ArrowLeft, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { getNotifications, markAsRead, markAllAsRead, type Notification } from "@/features/profile/notificationsApi";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "message": return <MessageCircle className="h-5 w-5 text-blue-500" />;
    case "rental_request": return <Send className="h-5 w-5 text-orange-500" />;
    case "rental_confirmation": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "reservation": return <Calendar className="h-5 w-5 text-green-500" />;
    case "view": return <Eye className="h-5 w-5 text-purple-500" />;
    case "review": return <CheckCircle2 className="h-5 w-5 text-amber-500" />;
    default: return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
};

// Shared notification list component
const NotificationList = ({
  notifications,
  filter,
  setFilter,
  onNotificationClick,
  onMarkAllRead,
  language,
  t,
  formatTime,
  unreadCount,
}: {
  notifications: Notification[];
  filter: "all" | "unread";
  setFilter: (f: "all" | "unread") => void;
  onNotificationClick: (n: Notification) => void;
  onMarkAllRead: () => void;
  language: string;
  t: (ro: string, en: string) => string;
  formatTime: (d: string) => string;
  unreadCount: number;
}) => {
  const filtered = filter === "unread" ? notifications.filter(n => !n.is_read) : notifications;

  return (
    <>
      {/* Filter tabs */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {t("Toate", "All")}
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === "unread" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {t("Necitite", "Unread")}
        </button>
      </div>

      {/* Notification items */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length > 0 ? (
          filtered.map((n) => (
            <button
              key={n.id}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                !n.is_read ? "bg-primary/5" : ""
              }`}
              onClick={() => onNotificationClick(n)}
            >
              <div className="flex-shrink-0 mt-0.5 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                {getNotificationIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold" : "font-normal text-muted-foreground"}`}>
                  {language === "ro" ? n.title_ro : (n.title_en || n.title_ro)}
                </p>
                {(n.description_ro || n.description_en) && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {language === "ro" ? n.description_ro : (n.description_en || n.description_ro)}
                  </p>
                )}
                <span className={`text-xs mt-0.5 block ${!n.is_read ? "text-primary font-medium" : "text-muted-foreground/60"}`}>
                  {formatTime(n.created_at)}
                </span>
              </div>
              {!n.is_read && (
                <div className="flex-shrink-0 mt-2">
                  <span className="block h-2.5 w-2.5 rounded-full bg-primary" />
                </div>
              )}
            </button>
          ))
        ) : (
          <div className="px-4 py-12 text-sm text-muted-foreground text-center">
            {filter === "unread"
              ? t("Nu ai notificări necitite", "No unread notifications")
              : t("Nu ai notificări noi", "No new notifications")}
          </div>
        )}
      </div>
    </>
  );
};

const NotificationBell = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data.slice(0, 20));
      } catch (e) { console.error(e); }
    };
    load();

    const channel = supabase
      .channel("notification-bell")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: language === "ro" ? ro : enUS,
    });
  };

  const mapLink = (link: string) => {
    if (link.includes("?tab=lendings")) return "/profile#anunturi";
    if (link.includes("?tab=rentals")) return "/profile#cereri";
    return link;
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      try {
        await markAsRead(n.id);
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      } catch (e) { console.error(e); }
    }
    if (n.link) {
      if (isMobile) setMobileOpen(false);
      navigate(mapLink(n.link));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) { console.error(e); }
  };

  // Lock body scroll when mobile fullscreen is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Mobile: full-screen overlay
  if (isMobile) {
    return (
      <>
        <Button variant="ghost" size="icon" className="relative" onClick={() => setMobileOpen(true)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>

        {mobileOpen && (
          <div className="fixed inset-0 z-[100] bg-background" style={{ height: '100dvh' }}>
            <div className="flex flex-col h-full bg-background">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileOpen(false)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-bold flex-1">{t("Notificări", "Notifications")}</h2>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs text-primary h-8 px-2" onClick={handleMarkAllRead}>
                    <CheckCheck className="h-4 w-4 mr-1" />
                    {t("Citește toate", "Read all")}
                  </Button>
                )}
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-2 px-4 py-3 shrink-0">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filter === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t("Toate", "All")}
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filter === "unread" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t("Necitite", "Unread")}
                </button>
              </div>

              {/* Notification items */}
              <div className="flex-1 overflow-y-auto bg-background">
                {(filter === "unread" ? notifications.filter(n => !n.is_read) : notifications).length > 0 ? (
                  (filter === "unread" ? notifications.filter(n => !n.is_read) : notifications).map((n) => (
                    <button
                      key={n.id}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                        !n.is_read ? "bg-primary/5" : ""
                      }`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="flex-shrink-0 mt-0.5 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        {getNotificationIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold" : "font-normal text-muted-foreground"}`}>
                          {language === "ro" ? n.title_ro : (n.title_en || n.title_ro)}
                        </p>
                        {(n.description_ro || n.description_en) && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {language === "ro" ? n.description_ro : (n.description_en || n.description_ro)}
                          </p>
                        )}
                        <span className={`text-xs mt-0.5 block ${!n.is_read ? "text-primary font-medium" : "text-muted-foreground/60"}`}>
                          {formatTime(n.created_at)}
                        </span>
                      </div>
                      {!n.is_read && (
                        <div className="flex-shrink-0 mt-2">
                          <span className="block h-2.5 w-2.5 rounded-full bg-primary" />
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Bell className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">
                      {filter === "unread"
                        ? t("Nu ai notificări necitite", "No unread notifications")
                        : t("Nu ai notificări noi", "No new notifications")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop: dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 bg-background border border-border shadow-lg rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <h3 className="text-lg font-bold">{t("Notificări", "Notifications")}</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-primary h-7 px-2" onClick={handleMarkAllRead}>
              {t("Citește toate", "Read all")}
            </Button>
          )}
        </div>

        <div className="max-h-80">
          <NotificationList
            notifications={notifications}
            filter={filter}
            setFilter={setFilter}
            onNotificationClick={handleNotificationClick}
            onMarkAllRead={handleMarkAllRead}
            language={language}
            t={t}
            formatTime={formatTime}
            unreadCount={unreadCount}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-border">
          <Link
            to="/profile#notificari"
            className="block w-full text-center text-sm font-medium text-primary py-3 hover:bg-muted/50 transition-colors"
          >
            {t("Vezi toate notificările", "View all notifications")}
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
