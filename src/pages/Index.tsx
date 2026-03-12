import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import bannerBg from "@/assets/banner_hero.png";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSearchForm from "@/components/HeroSearchForm";
import FeaturedListings from "@/components/home/FeaturedListings";
import { categories } from "@/data/categories";
import { getCategoryIcon } from "@/data/categoryIcons";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const copy = useUxCopy();
  const { language } = useLanguage();
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const img = document.getElementById("hero-parallax-img") as HTMLImageElement | null;
      if (!img) return;
      const scrollY = window.scrollY;
      img.style.transform = `translateY(${scrollY * 0.4}px)`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: categoryCounts } = useQuery({
    queryKey: ["category-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("category")
        .eq("is_active", true);
      if (error) return {};
      const counts: Record<string, number> = {};
      data?.forEach((p) => {
        if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
      });
      return counts;
    },
    staleTime: 5 * 60 * 1000,
  });

  const popularCategoryIds = [1, 2, 6, 7, 22, 19, 4, 5, 9, 3, 10, 11];
  const popularCategories = categories.filter((c) => popularCategoryIds.includes(c.id));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden h-[500px]">
        <img src={bannerBg} alt="" fetchPriority="high" decoding="async" className="absolute inset-0 w-full h-[130%] object-cover" style={{ transform: 'translateZ(0)' }} id="hero-parallax-img" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="container relative h-full flex flex-col items-center justify-center">
          <div className="mx-auto w-full max-w-4xl text-center">
            <h1 className="mt-[30px] animate-fade-up font-heading font-bold tracking-tight text-white md:mt-0 text-4xl">
              {copy.home.heroTitle}{" "}
              <br className="md:hidden" />
              <span className="text-primary">{copy.home.heroTitleHighlight}</span>
            </h1>
            <div className="mt-6 animate-fade-up md:mx-0 md:mt-10" style={{ animationDelay: "0.2s" }}>
              <HeroSearchForm />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-3xl font-semibold text-foreground">{copy.home.popularCategories}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {popularCategories.map((category) => {
              const Icon = getCategoryIcon(category.id);
              const name = language === "en" ? (category.nameEn || category.name) : category.name;
              const count = categoryCounts?.[category.name] || 0;
              return (
                <Link
                  key={category.id}
                  to={`/categorie/${category.slug}`}
                  className="group flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {count} {language === "en" ? "listings" : "anunțuri"}
                  </p>
                </Link>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link to="/categorii">{copy.common.viewAll}<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <FeaturedListings />

      {/* CTA Banner */}
      <section className="py-16" style={{ background: 'linear-gradient(to right, #F97B1D, #FAA738)' }}>
        <div className="container text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            {language === "ro" ? "Ai ceva de închiriat?" : "Have something to rent?"}
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto">
            {language === "ro"
              ? "Transformă obiectele neutilizate în bani. Listează gratuit și începe să câștigi."
              : "Turn unused items into money. List for free and start earning."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="ghost" size="lg" className="bg-[#FFFFFF] text-[#000000] hover:bg-[#FFFFFF]/90 font-semibold rounded-xl px-8">
              <Link to="/owner/new-product">
                {language === "ro" ? "Listează acum" : "List now"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="bg-[#000000] text-[#FFFFFF] hover:bg-[#000000]/80 font-semibold rounded-xl px-8">
              <Link to="/cum-functioneaza">
                {language === "ro" ? "Cum funcționează" : "How it works"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>);

};

export default Index;