import { Link } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCountUp } from "@/hooks/useCountUp";

interface CategoryHeroProps {
  name: string;
  bannerImage: string;
  total: number;
  newThisWeek: number;
  topCity: string | null;
}

const CategoryHero = ({ name, bannerImage, total, newThisWeek, topCity }: CategoryHeroProps) => {
  const { t } = useLanguage();
  const totalCount = useCountUp(total, 700);
  const newCount = useCountUp(newThisWeek, 700);

  return (
    <header className="relative h-[280px] md:h-[380px] w-full overflow-hidden">
      <div className="absolute inset-0 motion-safe:animate-ken-burns">
        <img
          src={bannerImage}
          alt={name}
          className="h-full w-full object-cover"
          loading="eager"
        />
      </div>
      {/* Dual gradient: keep photo crisp, ensure legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

      <div className="container relative z-10 flex h-full flex-col items-center text-center md:items-start md:text-left justify-end pb-8 md:pb-10">
        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center justify-center md:justify-start gap-1.5 text-xs text-white/75">
          <Link to="/" className="hover:text-white transition-colors">{t("Acasă", "Home")}</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/categorii" className="hover:text-white transition-colors">{t("Categorii", "Categories")}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white/90">{name}</span>
        </nav>

        <h1 className="font-heading text-4xl md:text-5xl font-bold text-white drop-shadow-md max-w-3xl mx-auto md:mx-0">
          {name}
        </h1>

        {/* Stats chips */}
        <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/20 backdrop-blur-md">
            <span className="font-semibold tabular-nums">{totalCount}</span>
            {t("produse disponibile", "products available")}
          </span>
          {newThisWeek > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1.5 text-sm font-medium text-primary-foreground ring-1 ring-white/20 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="tabular-nums">{newCount}</span>
              {t("noi săptămâna aceasta", "new this week")}
            </span>
          )}
          {topCity && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/20 backdrop-blur-md">
              {t("Activitate ridicată în", "High activity in")}{" "}
              <span className="font-semibold">{topCity}</span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default CategoryHero;
