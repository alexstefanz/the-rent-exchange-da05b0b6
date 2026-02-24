import { Link } from "react-router-dom";
import { ArrowRight, Shield, Clock, Sparkles, Search, Wallet, ShieldCheck, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSearchForm from "@/components/HeroSearchForm";
import TrustBadges from "@/components/trust/TrustBadges";
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[400px] rounded-full bg-primary/20 blur-[100px] animate-blob-drift" />
        <div className="container relative pt-16 pb-8 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mt-[30px] animate-fade-up font-heading font-bold tracking-tight text-foreground md:mt-0 md:text-4xl lg:text-5xl text-4xl">
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
              const colors = ["bg-yellow-100", "bg-blue-100", "bg-amber-100", "bg-orange-100", "bg-indigo-100", "bg-emerald-100", "bg-pink-100", "bg-cyan-100", "bg-rose-100"];
              const bgColor = colors[(category.id - 1) % colors.length];
              return (
                <Link key={category.id} to={`/categorie/${category.id}`} className="group flex flex-col items-center text-center">
                  <div className={`mb-3 flex h-16 w-16 items-center justify-center rounded-full ${bgColor} transition-transform group-hover:scale-110 sm:h-20 sm:w-20`}>
                    <Icon className="h-8 w-8 text-foreground sm:h-10 sm:w-10" />
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

      <section className="border-y border-border bg-secondary/30 py-16 md:py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-semibold text-foreground">{copy.home.howItWorks}</h2>
            <p className="mt-2 text-muted-foreground">{copy.home.howItWorksSubtitle}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
            { icon: Sparkles, title: copy.home.step1Title, description: copy.home.step1Desc },
            { icon: Clock, title: copy.home.step2Title, description: copy.home.step2Desc },
            { icon: Shield, title: copy.home.step3Title, description: copy.home.step3Desc }].
            map((step) =>
            <div key={step.title} className="group rounded-2xl bg-card p-8 shadow-card transition-all hover:shadow-card-hover">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-heading text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <h2 className="font-heading text-3xl font-semibold text-foreground">
                {language === "en" ? "About Us" : "Despre noi"}
              </h2>
            </div>
            <div className="space-y-6 text-center">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {language === "en" ?
                "Rentli is Romania's national peer-to-peer rental marketplace." :
                "Rentli este marketplace-ul național de închirieri între persoane din România."}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {language === "en" ?
                "We connect people who have things with people who need them, in a safe and transparent environment." :
                "Conectăm oameni care au lucruri cu oameni care au nevoie de ele, într-un cadru sigur și transparent."}
              </p>
              <div className="grid gap-4 pt-4 md:grid-cols-3">
                {[
                {
                  icon: Search,
                  text: language === "en" ? "Quickly rent what you need" : "Închiriază rapid ceea ce ai nevoie"
                },
                {
                  icon: Wallet,
                  text: language === "en" ? "Earn money from things you don't use" : "Câștigă bani din lucrurile pe care nu le folosești"
                },
                {
                  icon: ShieldCheck,
                  text: language === "en" ? "Protected payments & verified users" : "Plăți protejate și utilizatori verificați"
                }].
                map((item) =>
                <div key={item.text} className="flex flex-col items-center gap-3 rounded-2xl bg-secondary/40 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">{item.text}</p>
                  </div>
                )}
              </div>
              <p className="flex items-center justify-center gap-2 pt-2 text-muted-foreground">
                <Handshake className="h-5 w-5 text-primary" />
                {language === "en" ?
                "We're building an economy based on access, trust, and efficiency." :
                "Construim o economie bazată pe acces, încredere și eficiență."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="rounded-3xl bg-primary p-[15px] text-center md:p-16">
            <h2 className="font-heading text-[25px] font-semibold leading-tight text-primary-foreground md:text-4xl">
              {language === "en" ?
              "The first national peer-to-peer rental marketplace. Safe. Verified. Insured." :
              "Primul marketplace național de închirieri între persoane. Sigur. Verificat. Asigurat."}
            </h2>
            <div className="mt-8">
              <TrustBadges />
            </div>
            <div className="mt-8 flex justify-center">
              <Button variant="secondary" size="xl" asChild>
                <Link to="/adauga-anunt">{copy.home.ctaButton}<ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>);

};

export default Index;