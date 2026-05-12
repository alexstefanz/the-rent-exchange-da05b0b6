import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  startDate: string;
  endDate: string;
  hidden?: boolean;
}

function fmt(ms: number, lang: "ro" | "en") {
  const abs = Math.max(0, ms);
  const totalMin = Math.floor(abs / 60000);
  const d = Math.floor(totalMin / (60 * 24));
  const h = Math.floor((totalMin % (60 * 24)) / 60);
  const m = totalMin % 60;
  const dL = lang === "ro" ? "z" : "d";
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}${dL}`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.slice(0, 3).join(" ");
}

export default function ReturnCountdownBadge({ startDate, endDate, hidden }: Props) {
  const { language, t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (hidden) return null;

  const start = new Date(startDate).getTime();
  // Use end of day for end_date so the rental day itself counts in full
  const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1;

  let label = "";
  let cls = "bg-muted text-muted-foreground";

  if (now < start) {
    label = `${t("Începe în", "Starts in")} ${fmt(start - now, language as "ro" | "en")}`;
    cls = "bg-muted text-foreground/70";
  } else if (now < end) {
    const remaining = end - now;
    const last24 = remaining < 24 * 60 * 60 * 1000;
    label = `${t("Returnare în", "Return in")} ${fmt(remaining, language as "ro" | "en")}`;
    cls = last24
      ? "bg-destructive/10 text-destructive"
      : "bg-primary/10 text-primary";
  } else {
    label = `${t("Întârziere", "Overdue")}: ${fmt(now - end, language as "ro" | "en")}`;
    cls = "bg-destructive/10 text-destructive";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        cls
      )}
    >
      <Clock className="h-3 w-3" />
      {label}
    </span>
  );
}