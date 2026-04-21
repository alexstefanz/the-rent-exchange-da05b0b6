import { Search, Bell, PackageCheck, Star, ListPlus, Handshake, Wallet, Truck, Shield, UserCheck, ShieldCheck, Headphones, XCircle, BadgePercent, Send, CheckCircle2, Undo2, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TrustBadges from "@/components/trust/TrustBadges";
import { useUxCopy } from "@/hooks/useUxCopy";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

const HowItWorks = () => {
  const copy = useUxCopy();
  const p = copy.howItWorksPage;

  const tenantSteps = [
    { icon: Search, title: p.tenantStep1Title, desc: p.tenantStep1Desc },
    { icon: Bell, title: p.tenantStep2Title, desc: p.tenantStep2Desc },
    { icon: PackageCheck, title: p.tenantStep3Title, desc: p.tenantStep3Desc },
    { icon: Star, title: p.tenantStep4Title, desc: p.tenantStep4Desc },
  ];

  const ownerSteps = [
    { icon: ListPlus, title: p.ownerStep1Title, desc: p.ownerStep1Desc },
    { icon: Handshake, title: p.ownerStep2Title, desc: p.ownerStep2Desc },
    { icon: Truck, title: p.ownerStep3Title, desc: p.ownerStep3Desc },
    { icon: Wallet, title: p.ownerStep4Title, desc: p.ownerStep4Desc },
  ];

  const cycleSteps = [
    { icon: Send, title: p.cycleStep1Title, desc: p.cycleStep1Desc },
    { icon: CheckCircle2, title: p.cycleStep2Title, desc: p.cycleStep2Desc },
    { icon: Truck, title: p.cycleStep3Title, desc: p.cycleStep3Desc },
    { icon: PackageCheck, title: p.cycleStep4Title, desc: p.cycleStep4Desc },
    { icon: Undo2, title: p.cycleStep5Title, desc: p.cycleStep5Desc },
    { icon: Star, title: p.cycleStep6Title, desc: p.cycleStep6Desc },
  ];

  const escrowPoints = [p.escrowPoint1, p.escrowPoint2, p.escrowPoint3];

  const benefits = [
    { icon: Shield, title: p.benefit1Title, desc: p.benefit1Desc },
    { icon: UserCheck, title: p.benefit2Title, desc: p.benefit2Desc },
    { icon: ShieldCheck, title: p.benefit3Title, desc: p.benefit3Desc },
    { icon: Headphones, title: p.benefit4Title, desc: p.benefit4Desc },
    { icon: XCircle, title: p.benefit5Title, desc: p.benefit5Desc },
    { icon: BadgePercent, title: p.benefit6Title, desc: p.benefit6Desc },
  ];

  const faqs = [
    { q: p.faq1Q, a: p.faq1A },
    { q: p.faq2Q, a: p.faq2A },
    { q: p.faq3Q, a: p.faq3A },
    { q: p.faq4Q, a: p.faq4A },
    { q: p.faq5Q, a: p.faq5A },
    { q: p.faq6Q, a: p.faq6A },
    { q: p.faq7Q, a: p.faq7A },
    { q: p.faq8Q, a: p.faq8A },
  ];

  const StepCard = ({ step, index }: { step: typeof tenantSteps[0]; index: number }) => (
    <div className="group relative rounded-2xl bg-card p-6 shadow-card transition-all hover:shadow-card-hover">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 font-heading text-sm font-bold text-primary">
          {index + 1}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
          <step.icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">{step.title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Breadcrumb */}
      <div className="container pt-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/">Acasă</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{p.heroTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Hero */}
      <section className="border-b border-border bg-secondary/30 py-16 md:py-20">
        <div className="container text-center">
          <h1 className="font-heading text-3xl font-semibold text-foreground md:text-4xl">{p.heroTitle}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{p.heroSubtitle}</p>
        </div>
      </section>

      {/* For Tenants */}
      <section className="py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-2xl font-semibold text-foreground">{p.forTenants}</h2>
            <p className="mt-2 text-muted-foreground">{p.forTenantsSubtitle}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tenantSteps.map((step, i) => (
              <StepCard key={i} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* For Owners */}
      <section className="border-y border-border bg-secondary/30 py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-2xl font-semibold text-foreground">{p.forOwners}</h2>
            <p className="mt-2 text-muted-foreground">{p.forOwnersSubtitle}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ownerSteps.map((step, i) => (
              <StepCard key={i} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Rentli */}
      <section className="py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-2xl font-semibold text-foreground">{p.whyRentli}</h2>
            <p className="mt-2 text-muted-foreground">{p.whyRentliSubtitle}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, i) => (
              <div key={i} className="rounded-2xl bg-card p-6 shadow-card">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">{b.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y border-border bg-secondary/30 py-10">
        <div className="container">
          <TrustBadges />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-2xl font-semibold text-foreground">{p.faqTitle}</h2>
            <p className="mt-2 text-muted-foreground">{p.faqSubtitle}</p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-heading text-base">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary/5 py-16">
        <div className="container text-center">
          <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">{p.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{p.ctaSubtitle}</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link to="/cauta">{p.ctaRent}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/adauga-anunt">{p.ctaList}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
