import { useState } from "react";
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
import { formatDistanceToNow } from "date-fns";
import { ro, enUS } from "date-fns/locale";

interface Notification {
  id: string;
  type: "message" | "reservation" | "view" | "review" | "system";
  title: string;
  description: string;
  createdAt: string;
  isRead: boolean;
}

const NotificationsTab = () => {
  const { t, language } = useLanguage();

  // Mock notifications - to be replaced with real data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "message",
      title: t("Mesaj nou", "New message"),
      description: t(
        "Ai primit un mesaj nou de la Ion Popescu",
        "You received a new message from Ion Popescu"
      ),
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
      isRead: false,
    },
    {
      id: "2",
      type: "reservation",
      title: t("Rezervare confirmată", "Reservation confirmed"),
      description: t(
        "Rezervarea ta pentru 'Bicicletă MTB' a fost confirmată",
        "Your reservation for 'MTB Bike' has been confirmed"
      ),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      isRead: false,
    },
    {
      id: "3",
      type: "view",
      title: t("Produs vizualizat", "Product viewed"),
      description: t(
        "Produsul tău 'Aparat foto Canon' a fost vizualizat de 15 ori",
        "Your product 'Canon Camera' has been viewed 15 times"
      ),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      isRead: true,
    },
  ]);

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: language === "ro" ? ro : enUS,
    });
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "message":
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case "reservation":
        return <Calendar className="h-5 w-5 text-green-500" />;
      case "view":
        return <Eye className="h-5 w-5 text-purple-500" />;
      case "review":
        return <CheckCircle2 className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
      {/* Header with Mark All as Read */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">
            {t("Notificări", "Notifications")}
          </h3>
          {unreadCount > 0 && (
            <Badge variant="default">{unreadCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            {t("Marchează toate ca citite", "Mark all as read")}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`transition-all ${
              !notification.isRead ? "border-primary/30 bg-primary/5" : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium">
                      {notification.title}
                      {!notification.isRead && (
                        <span className="inline-block w-2 h-2 bg-primary rounded-full ml-2" />
                      )}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.description}
                  </p>
                </div>

                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => markAsRead(notification.id)}
                  >
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
