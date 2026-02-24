import { ArrowRight, Search, Wallet, ShieldCheck, Handshake } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TrustBadges from "@/components/trust/TrustBadges";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";

const AboutUs = () => {
  const copy = useUxCopy();
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-16 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <h1 className="font-heading text-3xl font-semibold text-foreground">
                {language === "en" ? "About Us" : "Despre noi"}
              </h1>
            </div>
            <div className="space-y-6 text-center">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {language === "en"
                  ? "Rentli is Romania's national peer-to-peer rental marketplace."
                  : "Rentli este marketplace-ul național de închirieri între persoane din România."}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {language === "en"
                  ? "We connect people who have things with people who need them, in a safe and transparent environment."
                  : "Conectăm oameni care au lucruri cu oameni care au nevoie de ele, într-un cadru sigur și transparent."}
              </p>
              <div className="grid gap-4 pt-4 md:grid-cols-3">
                {[
                  {
                    icon: Search,
                    text: language === "en" ? "Quickly rent what you need" : "Închiriază rapid ceea ce ai nevoie",
                  },
                  {
                    icon: Wallet,
                    text: language === "en" ? "Earn money from things you don't use" : "Câștigă bani din lucrurile pe care nu le folosești",
                  },
                  {
                    icon: ShieldCheck,
                    text: language === "en" ? "Protected payments & verified users" : "Plăți protejate și utilizatori verificați",
                  },
                ].map((item) => (
                  <div key={item.text} className="flex flex-col items-center gap-3 rounded-2xl bg-secondary/40 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
              <p className="flex items-center justify-center gap-2 pt-2 text-muted-foreground">
                <Handshake className="h-5 w-5 text-primary" />
                {language === "en"
                  ? "We're building an economy based on access, trust, and efficiency."
                  : "Construim o economie bazată pe acces, încredere și eficiență."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="rounded-3xl bg-primary p-[15px] text-center md:p-16">
            <h2 className="font-heading text-[25px] font-semibold leading-tight text-primary-foreground md:text-4xl">
              {language === "en"
                ? "The first national peer-to-peer rental marketplace. Safe. Verified. Insured."
                : "Primul marketplace național de închirieri între persoane. Sigur. Verificat. Asigurat."}
            </h2>
            <div className="mt-8">
              <TrustBadges />
            </div>
            <div className="mt-8 flex justify-center">
              <Button variant="secondary" size="xl" asChild>
                <Link to="/adauga-anunt">
                  {copy.home.ctaButton}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
