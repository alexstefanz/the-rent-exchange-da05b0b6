import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { getCategoryStyle, getTypeIcon } from "@/lib/notificationCategory";
import type { Notification } from "@/features/profile/notificationsApi";

interface Props {
  notification: Notification;
  onSelect: (n: Notification) => void;
  onMarkRead: (id: string) => void;
}

function getQuickAction(type: string, language: string): { label: string } | null {
  const t = (type || "").toLowerCase();
  const lang = (ro: string, en: string) => (language === "ro" ? ro : en);
  if (t === "rental_request") return { label: lang("Vezi cererea", "View request") };
  if (t === "rental_confirmation") return { label: lang("Vezi rezervarea", "View booking") };
  if (t.includes("message")) return { label: lang("Răspunde", "Reply") };
  if (t.includes("payment") || t.includes("payout") || t.includes("withdraw"))
    return { label: lang("Vezi plata", "View payment") };
  if (t.includes("ticket") || t.includes("support"))
    return { label: lang("Deschide ticket", "Open ticket") };
  if (t.includes("inspection")) return { label: lang("Completează", "Complete") };
  if (t === "kyc_approved") return { label: lang("Adaugă anunț", "Add listing") };
  if (t === "review_received" || t === "review")
    return { label: lang("Vezi recenzia", "View review") };
  return null;
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
    <motion.button
      type="button"
      onClick={handleClick}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "group relative w-full text-left overflow-hidden",
        "flex items-start gap-3 px-3 py-3 rounded-xl transition-all duration-200",
        "hover:bg-muted/50",
        isUnread && "bg-primary/[0.04]",
      )}
    >
      {/* Left accent bar for unread */}
      {isUnread && (
        <span
          className={cn("absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full", style.accentClass)}
        />
      )}

      {/* Icon halo */}
      <span
        className={cn(
          "shrink-0 flex items-center justify-center h-10 w-10 rounded-xl",
          style.haloClass,
        )}
      >
        <Icon className={cn("h-[18px] w-[18px]", style.iconClass)} />
      </span>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-snug truncate",
              isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/85",
            )}
          >
            {title}
          </p>
          <span className="shrink-0 text-[11px] text-muted-foreground/70 whitespace-nowrap pt-[2px]">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: dateLocale })}
          </span>
        </div>

        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{description}</p>
        )}

        {action && (
          <div className="mt-2 flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-[11px] font-semibold rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              {action.label}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Pulse dot unread */}
      {isUnread && (
        <span className="shrink-0 mt-1.5 relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-50 animate-ping" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
        </span>
      )}
    </motion.button>
  );
}