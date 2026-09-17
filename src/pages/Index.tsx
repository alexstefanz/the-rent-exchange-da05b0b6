import { Suspense } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import HeroDynamic from "@/components/home/HeroDynamic";
import TrustBarPremium from "@/components/home/TrustBarPremium";
import SocialProofLive from "@/components/home/SocialProofLive";
const FeaturedListings = lazyWithRetry(() => import("@/components/home/FeaturedListings"));
const WhyChooseUsBento = lazyWithRetry(() => import("@/components/home/WhyChooseUsBento"));
const HowItWorksMini = lazyWithRetry(() => import("@/components/home/HowItWorksMini"));
const Footer = lazyWithRetry(() => import("@/components/layout/Footer"));
import { categories } from "@/data/categories";
import { getCategoryIcon } from "@/data/categoryIcons";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategoryCounts } from "@/hooks/queries/useCategoryCounts";
import { usePageSeo } from "@/hooks/usePageSeo";

const Index = () => {
  const copy = useUxCopy();
  const { language } = useLanguage();

  const categoryCounts = useCategoryCounts();

  usePageSeo({
    title: language === "en"
      ? "Rent anything in Romania — tools, photo, camping | Rentli"
      : "Închiriază orice în România — unelte, foto, camping | Rentli",
    description: language === "en"
      ? "Peer-to-peer rental marketplace in Romania: tools, electronics, camping, sport and events. Verified owners, secure payment, photo handover."
      : "Marketplace de închirieri între oameni: unelte, electronice, camping, sport, evenimente. Proprietari verificați, plată securizată, predare cu poze.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: language === "en" ? "Rental categories on Rentli" : "Categorii de închirieri pe Rentli",
      itemListElement: categories.map((category, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: language === "en" ? (category.nameEn || category.name) : category.name,
        url: `https://rentli.ro/categorie/${category.slug}`,
      })),
    },
  });



  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <HeroDynamic />

      <TrustBarPremium />

      <SocialProofLive />

      <section className="pt-16 pb-10">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-3xl font-semibold text-foreground">{copy.home.popularCategories}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.id);
              const name = language === "en" ? (category.nameEn || category.name) : category.name;
              const count = categoryCounts?.[category.name] || 0;
              return (
                <Link
                  key={category.id}
                  to={`/categorie/${category.slug}`}
                  className="group flex flex-col items-center rounded-xl bg-card p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                  style={{ boxShadow: 'rgba(35, 29, 26, 0.08) 0px 4px 20px -4px' }}
                >
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
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
        </div>
      </section>

      <Suspense fallback={<div className="py-12" />}>
        <FeaturedListings />
      </Suspense>

      <Suspense fallback={<div className="py-12" />}>
        <HowItWorksMini />
      </Suspense>

      <Suspense fallback={<div className="py-12" />}>
        <WhyChooseUsBento />
      </Suspense>

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

      <Suspense fallback={<div className="py-8" />}>
        <Footer />
      </Suspense>
    </div>);

};

export default Index;
