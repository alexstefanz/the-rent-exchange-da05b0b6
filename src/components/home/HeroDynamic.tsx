import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import SmartSearch from "./SmartSearch";
import { cn } from "@/lib/utils";

interface Slide {
  src: string;
  mobileSrcSet?: string;
  alt: string;
  labelRo: string;
  labelEn: string;
}

const SLIDES: Slide[] = [
  {
    src: "/images/banner_hero.webp",
    mobileSrcSet:
      "/images/banner_hero_mobile.webp 1x, /images/banner_hero_mobile@2x.webp 2x, /images/banner_hero_mobile@3x.webp 3x",
    alt: "Marketplace de închirieri Rentli",
    labelRo: "Electronice",
    labelEn: "Electronics",
  },
  { src: "/images/hero/hero-outdoor.webp", alt: "Echipament outdoor în munți", labelRo: "Outdoor", labelEn: "Outdoor" },
  { src: "/images/hero/hero-events.webp", alt: "Echipamente pentru evenimente", labelRo: "Evenimente", labelEn: "Events" },
  { src: "/images/hero/hero-travel.webp", alt: "Călătorii și travel", labelRo: "Travel", labelEn: "Travel" },
  { src: "/images/hero/hero-tools.webp", alt: "Unelte profesionale", labelRo: "Unelte", labelEn: "Tools" },
];

const ROTATE_MS = 6000;

const HeroDynamic = () => {
  const { language, t } = useLanguage();
  const [active, setActive] = useState(0);
  // Tracks which slides have ever been activated, so we only mount images on demand.
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0]));
  const [paused, setPaused] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive((a) => (a + 1) % SLIDES.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [paused]);

  // Mark active slide as loaded, and warm the next one slightly ahead of time.
  useEffect(() => {
    setLoaded((prev) => {
      const next = new Set(prev);
      next.add(active);
      next.add((active + 1) % SLIDES.length);
      return next;
    });
  }, [active]);

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden h-[80svh] md:h-[560px] isolate"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {SLIDES.map((slide, i) => loaded.has(i) ? (
        <div
          key={slide.src}
          aria-hidden={i !== active}
          className={cn(
            "absolute inset-0 transition-opacity duration-[800ms] ease-out will-change-[opacity]",
            i === active ? "opacity-100" : "opacity-0",
          )}
        >
          <picture>
            {slide.mobileSrcSet && (
              <source media="(max-width: 768px)" srcSet={slide.mobileSrcSet} type="image/webp" />
            )}
            <img
              src={slide.src}
              alt={i === 0 ? slide.alt : ""}
              width={1920}
              height={1088}
              {...(i === 0 ? { fetchpriority: "high" } : { fetchpriority: "low" })}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              className={cn(
                "absolute inset-0 w-full h-full object-cover",
                "motion-safe:animate-[hero-zoom_14s_ease-in-out_infinite_alternate]",
              )}
            />
          </picture>
        </div>
      ) : null)}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/55 z-10" />

      {/* Content */}
      <div className="container relative z-20 h-full flex flex-col items-center justify-center">
        <div className="mx-auto w-full max-w-4xl text-center">
          {/* Category chip */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white border border-white/20 mb-4 animate-fade-in">
            <span className="block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {language === "en" ? SLIDES[active].labelEn : SLIDES[active].labelRo}
          </div>

          <h1 className="font-heading font-bold tracking-tight text-white text-3xl sm:text-4xl md:text-5xl leading-tight">
            {t("Închiriază orice, oriunde în", "Rent anything, anywhere in")}{" "}
            <span className="text-primary">{t("România", "Romania")}</span>
          </h1>
          <p className="mt-3 text-white/80 text-sm md:text-base max-w-xl mx-auto">
            {t(
              "Mii de produse verificate. Plăți sigure. Suport dedicat.",
              "Thousands of verified items. Secure payments. Dedicated support.",
            )}
          </p>

          <div className="mt-6 md:mt-8">
            <SmartSearch />
          </div>
        </div>
      </div>

      {/* Dots indicator */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Slide ${i + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === active ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70",
            )}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroDynamic;