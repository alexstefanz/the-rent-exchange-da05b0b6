import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/hooks/queries/useNotifications";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { cn } from "@/lib/utils";

const NotificationBell = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { notifications } = useNotifications(user?.id);
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const [open, setOpen] = useState(false);

  const trigger = (
    <Button variant="ghost" size="icon" className="relative h-11 w-11" aria-label="Notifications">
      <Bell className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex">
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full bg-destructive opacity-60 animate-ping",
            )}
          />
          <span className="relative inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        </span>
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <>
        <button type="button" onClick={() => setOpen(true)} className="contents">
          {trigger}
        </button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="p-0 h-[100dvh] rounded-none border-0"
          >
            <NotificationCenter variant="sheet" onClose={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[420px] p-0 rounded-2xl border border-border/70 shadow-xl overflow-hidden"
      >
        <NotificationCenter variant="popover" onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
