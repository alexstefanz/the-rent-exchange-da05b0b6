import { Link } from "react-router-dom";
import bannerBg from "@/assets/banner_icon_background.jpg";
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

const Index = () => {
  const copy = useUxCopy();
  const { language } = useLanguage();
  const popularCategoryIds = [1, 2, 6, 7, 22, 19, 4, 5, 9];
  const popularCategories = categories.filter((c) => popularCategoryIds.includes(c.id));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <img src={bannerBg} alt="" fetchPriority="high" decoding="async" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="container relative pt-16 pb-8 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mt-[30px] animate-fade-up font-heading font-bold tracking-tight text-foreground md:mt-0 text-4xl">
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
          <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9">
            {popularCategories.map((category) => {
              const Icon = getCategoryIcon(category.id);
              return (
                <Link key={category.id} to={`/categorie/${category.id}`} className="group flex flex-col items-center text-center">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-transform group-hover:scale-110 sm:h-20 sm:w-20">
                    <Icon className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
                  </div>
                  <p className="text-xs font-medium text-foreground sm:text-sm">
                    {(() => {const n = language === "en" ? category.nameEn : category.name;return <>{n.split(" & ")[0]}{n.includes("&") && <><br /><span className="text-muted-foreground">{n.split(" & ")[1]?.split(" ")[0]}</span></>}</>;})()}
                  </p>
                </Link>);

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


      <Footer />
    </div>);

};

export default Index;