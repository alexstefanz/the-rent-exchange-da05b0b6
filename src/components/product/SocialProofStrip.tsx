import { TrendingUp, Calendar, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  timesRented?: number;
  watchersCount?: number;
  lastBookingAt?: string | null;
}

const SocialProofStrip = ({ timesRented, watchersCount, lastBookingAt }: Props) => {
  const { language, t } = useLanguage();
  const dateLocale = language === "ro" ? ro : enUS;

  const items: { icon: any; label: string }[] = [];
  if (timesRented && timesRented > 0) {
    items.push({ icon: TrendingUp, label: t(`Închiriat de ${timesRented} ori`, `Rented ${timesRented} times`) });
  }
  if (lastBookingAt) {
    const ago = formatDistanceToNow(new Date(lastBookingAt), { locale: dateLocale, addSuffix: true });
    items.push({ icon: Calendar, label: t(`Ultima rezervare ${ago}`, `Last booked ${ago}`) });
  }
  if (watchersCount && watchersCount > 0) {
    items.push({ icon: Eye, label: t(`${watchersCount} ${watchersCount === 1 ? "persoană urmărește" : "persoane urmăresc"}`, `${watchersCount} watching`) });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 text-foreground px-2.5 py-1 font-medium">
          <it.icon className="h-3.5 w-3.5 text-primary" />
          {it.label}
        </span>
      ))}
    </div>
  );
};

export default SocialProofStrip;
