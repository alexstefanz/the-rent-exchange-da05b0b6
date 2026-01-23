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
import { Link } from "react-router-dom";

// Mock notifications for now - will be replaced with real data later
const mockNotifications = [
  { id: 1, message: "Mesaj nou de la Ion", time: "5 min" },
  { id: 2, message: "Rezervare confirmată", time: "1 oră" },
  { id: 3, message: "Produs vizualizat de 5 ori", time: "2 ore" },
];

const NotificationBell = () => {
  const { t } = useLanguage();
  const unreadCount = mockNotifications.length;

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
      <DropdownMenuContent align="end" className="w-72 bg-background">
        <div className="px-3 py-2 font-semibold text-sm border-b border-border">
          {t("Notificări", "Notifications")}
        </div>
        <div className="max-h-64 overflow-y-auto">
          {mockNotifications.length > 0 ? (
            mockNotifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 py-3">
                <span className="text-sm">{notification.message}</span>
                <span className="text-xs text-muted-foreground">{notification.time}</span>
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
          <Link to="/notificari" className="text-sm font-medium text-primary">
            {t("Vezi toate notificările", "View all notifications")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
