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
    <div className="flex flex-col gap-1 px-2 pb-3">
      {ORDER.map((b) =>
        groups[b].length > 0 ? (
          <section key={b} className="flex flex-col">
            <header className="px-2 pt-3 pb-1.5 flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/80">
                {labels[b]}
              </span>
              <span className="flex-1 h-px bg-border/60" />
            </header>
            <div className="flex flex-col">
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