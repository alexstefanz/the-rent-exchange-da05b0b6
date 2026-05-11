import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHomepageActivity } from "@/hooks/useHomepageActivity";

function timeAgo(seconds: number, lang: "ro" | "en"): string {
  const m = Math.max(1, Math.floor(seconds / 60));
  if (m < 60) return lang === "en" ? `${m}m ago` : `acum ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === "en" ? `${h}h ago` : `acum ${h}h`;
  const d = Math.floor(h / 24);
  return lang === "en" ? `${d}d ago` : `acum ${d}z`;
}

const SocialProofLive = () => {
  const { t, language } = useLanguage();
  const { data } = useHomepageActivity();
  const rentals = data?.recent_rentals || [];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (rentals.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % rentals.length), 3500);
    return () => clearInterval(id);
  }, [rentals.length]);

  if (rentals.length === 0) return null;
  const cur = rentals[idx];
  const title = language === "en" && cur.product_title_en ? cur.product_title_en : cur.product_title;

  return (
    <section className="py-6">
      <div className="container">
        <div className="mx-auto max-w-2xl flex items-center justify-center gap-2 rounded-full bg-emerald-50 border border-emerald-200/60 px-4 py-2 text-sm">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <Activity className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="text-emerald-900 truncate">
            <strong>{title}</strong>{" "}
            {t("închiriat", "rented")}{" "}
            {cur.city ? `${language === "en" ? "in" : "în"} ${cur.city} · ` : ""}
            {timeAgo(cur.time_ago_seconds, language as "ro" | "en")}
          </span>
        </div>
      </div>
    </section>
  );
};

export default SocialProofLive;