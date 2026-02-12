import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { getNotifications, markAsRead, type Notification } from "@/features/profile/notificationsApi";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ro, enUS } from "date-fns/locale";

const NotificationBell = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data.slice(0, 5));
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
      addSuffix: false,
      locale: language === "ro" ? ro : enUS,
    });
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      try {
        await markAsRead(n.id);
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      } catch (e) { console.error(e); }
    }
    if (n.link) {
      navigate(n.link);
    }
  };

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
      <DropdownMenuContent align="end" className="w-80 bg-background">
        <div className="px-3 py-2 font-semibold text-sm border-b border-border">
          {t("Notificări", "Notifications")}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <DropdownMenuItem 
                key={n.id} 
                className={`flex flex-col items-start gap-1 py-3 cursor-pointer ${!n.is_read ? "bg-primary/5" : ""}`}
                onClick={() => handleNotificationClick(n)}
              >
                <span className="text-sm font-medium">{language === "ro" ? n.title_ro : (n.title_en || n.title_ro)}</span>
                {(n.description_ro || n.description_en) && (
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {language === "ro" ? n.description_ro : (n.description_en || n.description_ro)}
                  </span>
                )}
                <span className="text-xs text-muted-foreground/70">{formatTime(n.created_at)}</span>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              {t("Nu ai notificări noi", "No new notifications")}
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-center">
          <Link to="/profile#notificari" className="text-sm font-medium text-primary">
            {t("Vezi toate notificările", "View all notifications")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
