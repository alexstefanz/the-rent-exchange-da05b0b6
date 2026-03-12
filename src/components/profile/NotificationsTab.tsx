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
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Package,
  Loader2
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
import { getRentalDetailsForNotification, type RentalDetails } from "@/features/rentals/rentalDetailsApi";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const NotificationsTab = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rentalDetails, setRentalDetails] = useState<Record<string, RentalDetails>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  

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
      case "reservation":
      case "rental_request":
      case "rental_confirmation": return <Calendar className="h-5 w-5 text-green-500" />;
      case "view": return <Eye className="h-5 w-5 text-purple-500" />;
      case "review": return <CheckCircle2 className="h-5 w-5 text-amber-500" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const mapLink = (link: string) => {
    if (link.includes("#anunturi") || link.includes("?tab=lendings")) return "/anunturi";
    if (link.includes("#cereri") || link.includes("?tab=rentals")) return "/cereri";
    if (link.includes("#rezervari")) return "/rezervari";
    if (link.includes("#notificari")) return "/notificari";
    if (link === "/profile") return "/recenzii";
    return link;
  };

  const isRentalNotification = (type: string) => 
    type === "rental_request" || type === "rental_confirmation";

  const handleToggleExpand = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    // For rental notifications, expand inline details
    if (isRentalNotification(notification.type)) {
      if (expandedId === notification.id) {
        setExpandedId(null);
        return;
      }
      setExpandedId(notification.id);

      // Load rental details if not cached
      if (!rentalDetails[notification.id]) {
        setLoadingDetails(notification.id);
        try {
          const details = await getRentalDetailsForNotification(notification.link || "");
          if (details) {
            setRentalDetails(prev => ({ ...prev, [notification.id]: details }));
          }
        } catch (e) {
          console.error("Error loading rental details:", e);
        } finally {
          setLoadingDetails(null);
        }
      }
      return;
    }

    // For non-rental notifications, navigate to the linked page
    if (notification.link) {
      navigate(mapLink(notification.link));
    }
  };

  const handleStartChat = async (details: RentalDetails) => {
    if (!user || !details.product_id) return;
    
    const otherUserId = details.renter_id === user.id ? details.owner_id : details.renter_id;
    if (!otherUserId) return;

    // Find or create conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("product_id", details.product_id)
      .or(`buyer_id.eq.${user.id},owner_id.eq.${user.id}`)
      .limit(1)
      .maybeSingle();

    let conversationId = existing?.id;

    if (!conversationId) {
      const { data: created } = await supabase
        .from("conversations")
        .insert({
          product_id: details.product_id,
          buyer_id: details.renter_id === user.id ? user.id : otherUserId,
          owner_id: details.owner_id === user.id ? user.id : otherUserId,
        })
        .select("id")
        .single();
      conversationId = created?.id;
    }

    if (conversationId) {
      navigate(`/mesaje?conv=${conversationId}`);
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

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: t("În așteptare", "Pending"), variant: "secondary" },
      confirmed: { label: t("Confirmat", "Confirmed"), variant: "default" },
      active: { label: t("Activ", "Active"), variant: "default" },
      completed: { label: t("Finalizat", "Completed"), variant: "outline" },
      cancelled: { label: t("Anulat", "Cancelled"), variant: "destructive" },
    };
    const s = map[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

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
        {notifications.map((notification) => {
          const isExpanded = expandedId === notification.id;
          const isRental = isRentalNotification(notification.type);
          const details = rentalDetails[notification.id];

          return (
            <Card 
              key={notification.id} 
              className={`transition-all ${!notification.is_read ? "border-primary/30 bg-primary/5" : ""} ${isRental ? "cursor-pointer" : ""}`}
            >
              <CardContent className="p-4">
                <div 
                  className="flex items-start gap-4"
                  onClick={() => isRental && handleToggleExpand(notification)}
                >
                  <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium">
                        {language === "ro" ? notification.title_ro : (notification.title_en || notification.title_ro)}
                        {!notification.is_read && <span className="inline-block w-2 h-2 bg-primary rounded-full ml-2" />}
                      </h4>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(notification.created_at)}</span>
                        {isRental && (isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === "ro" ? notification.description_ro : (notification.description_en || notification.description_ro)}
                    </p>
                  </div>
                  {!notification.is_read && !isRental && (
                    <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Expanded rental details */}
                {isExpanded && isRental && (
                  <div className="mt-4 pt-4 border-t border-border">
                    {loadingDetails === notification.id ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : details ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{details.product_title}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">{t("Perioadă", "Period")}:</span>
                            <p className="font-medium">{details.start_date} → {details.end_date}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t("Zile", "Days")}:</span>
                            <p className="font-medium">{details.rental_days}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t("Total", "Total")}:</span>
                            <p className="font-medium">{details.subtotal} RON</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <div className="mt-0.5">{getStatusBadge(details.status)}</div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={(e) => { e.stopPropagation(); handleStartChat(details); }}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {notification.type === "rental_request" 
                            ? t("Discută cu chiriașul", "Chat with renter")
                            : t("Discută cu proprietarul", "Chat with owner")}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        {t("Nu s-au putut încărca detaliile", "Could not load details")}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        conversationId={chatConversationId}
        otherUserName={chatOtherUserName}
        otherUserAvatar={chatOtherUserAvatar}
        productTitle={chatProductTitle}
      />
    </div>
  );
};

export default NotificationsTab;
