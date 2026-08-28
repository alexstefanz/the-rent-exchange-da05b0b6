import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { getCategoryStyle, getTypeIcon } from "@/lib/notificationCategory";
import type { Notification } from "@/features/profile/notificationsApi";

interface Props {
  notification: Notification;
  onSelect: (n: Notification) => void;
  onMarkRead: (id: string) => void;
}


export function NotificationCard({ notification, onSelect, onMarkRead }: Props) {
  const { language } = useLanguage();
  const style = getCategoryStyle(notification.type);
  const Icon = getTypeIcon(notification.type);
  const dateLocale = language === "ro" ? ro : enUS;
  const isUnread = !notification.is_read;
  const action = getQuickAction(notification.type, language);

  const title = language === "ro" ? notification.title_ro : notification.title_en || notification.title_ro;
  const description =
    language === "ro"
      ? notification.description_ro
      : notification.description_en || notification.description_ro;

  const handleClick = () => {
    if (isUnread) onMarkRead(notification.id);
    onSelect(notification);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group w-full text-left cursor-pointer",
        "flex items-start gap-3 px-4 py-3 transition-colors duration-150",
        "hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none",
      )}
    >
      {/* Icon */}
      <span
        className={cn(
          "shrink-0 mt-0.5 flex items-center justify-center h-8 w-8 rounded-lg",
          style.haloClass,
          "opacity-90",
        )}
      >
        <Icon className={cn("h-4 w-4", style.iconClass)} />
      </span>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p
            className={cn(
              "flex-1 min-w-0 text-[13px] leading-snug break-words",
              isUnread ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
            )}
          >
            {title}
          </p>
          {isUnread && (
            <span className="shrink-0 mt-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden />
          )}
        </div>

        <span className="mt-0.5 block text-[11px] text-muted-foreground/70">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: dateLocale })}
        </span>

        {description && (
          <p
            className={cn(
              "mt-0.5 text-xs line-clamp-2",
              isUnread ? "text-muted-foreground" : "text-muted-foreground/70",
            )}
          >
            {description}
          </p>
        )}

        {action && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2 h-7 px-2.5 text-[11px] font-semibold rounded-lg"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            {action.label}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    </button>
  );
}
