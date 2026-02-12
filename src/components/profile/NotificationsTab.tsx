import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell,
  MessageCircle,
  CheckCircle2,
  Calendar,
  Eye,
  Check,
  CheckCheck
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { 
  getNotifications, 
  markAsRead as apiMarkAsRead, 
  markAllAsRead as apiMarkAllAsRead,
  type Notification 
} from "@/features/profile/notificationsApi";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const NotificationsTab = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (e) {
        console.error("Error loading notifications:", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();

    // Realtime subscription
    const channel = supabase
      .channel("notifications-tab")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: language === "ro" ? ro : enUS,
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message": return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case "reservation": return <Calendar className="h-5 w-5 text-green-500" />;
      case "view": return <Eye className="h-5 w-5 text-purple-500" />;
      case "review": return <CheckCircle2 className="h-5 w-5 text-amber-500" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiMarkAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) { console.error(e); }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) { console.error(e); }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bell className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {t("Nicio notificare", "No notifications")}
          </h3>
          <p className="text-muted-foreground text-center max-w-md">
            {t(
              "Nu ai notificări noi. Te vom anunța când se întâmplă ceva important.",
              "You don't have any new notifications. We'll let you know when something important happens."
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">{t("Notificări", "Notifications")}</h3>
          {unreadCount > 0 && <Badge variant="default">{unreadCount}</Badge>}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            {t("Marchează toate ca citite", "Mark all as read")}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card key={notification.id} className={`transition-all ${!notification.is_read ? "border-primary/30 bg-primary/5" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium">
                      {language === "ro" ? notification.title_ro : (notification.title_en || notification.title_ro)}
                      {!notification.is_read && <span className="inline-block w-2 h-2 bg-primary rounded-full ml-2" />}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(notification.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === "ro" ? notification.description_ro : (notification.description_en || notification.description_ro)}
                  </p>
                </div>
                {!notification.is_read && (
                  <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => handleMarkAsRead(notification.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NotificationsTab;
