import { useLanguage } from "@/contexts/LanguageContext";
import { isToday, isYesterday, isThisWeek, parseISO } from "date-fns";
import { NotificationCard } from "./NotificationCard";
import type { Notification } from "@/features/profile/notificationsApi";

type Bucket = "today" | "yesterday" | "thisWeek" | "older";

function bucketOf(d: Date): Bucket {
  if (isToday(d)) return "today";
  if (isYesterday(d)) return "yesterday";
  if (isThisWeek(d, { weekStartsOn: 1 })) return "thisWeek";
  return "older";
}

const ORDER: Bucket[] = ["today", "yesterday", "thisWeek", "older"];

interface Props {
  notifications: Notification[];
  onSelect: (n: Notification) => void;
  onMarkRead: (id: string) => void;
}

export function NotificationGroups({ notifications, onSelect, onMarkRead }: Props) {
  const { t } = useLanguage();

  const labels: Record<Bucket, string> = {
    today: t("Astăzi", "Today"),
    yesterday: t("Ieri", "Yesterday"),
    thisWeek: t("Săptămâna aceasta", "This week"),
    older: t("Mai vechi", "Older"),
  };

  const groups: Record<Bucket, Notification[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  for (const n of notifications) {
    groups[bucketOf(parseISO(n.created_at))].push(n);
  }

  return (
    <div className="flex flex-col pb-2">
      {ORDER.map((b) =>
        groups[b].length > 0 ? (
          <section key={b} className="flex flex-col">
            <header className="px-4 pt-3 pb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70">
                {labels[b]}
              </span>
            </header>
            <div className="flex flex-col divide-y divide-border/50 border-t border-border/50">
              {groups[b].map((n) => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onSelect={onSelect}
                  onMarkRead={onMarkRead}
                />
              ))}
            </div>
          </section>
        ) : null,
      )}
    </div>
  );
}
