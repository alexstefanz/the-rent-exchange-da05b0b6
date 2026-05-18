import { Send, CheckCircle2, Package, Wrench, Undo2, Wallet, Check } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useUxCopy } from "@/hooks/useUxCopy";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import WhyChooseUsBento from "@/components/home/WhyChooseUsBento";

const HowItWorks = () => {
  const copy = useUxCopy();
  const p = copy.howItWorksPage;

  const cycleSteps = [
    { icon: Send, title: p.cycleStep1Title, desc: p.cycleStep1Desc },
    { icon: CheckCircle2, title: p.cycleStep2Title, desc: p.cycleStep2Desc },
    { icon: Package, title: p.cycleStep3Title, desc: p.cycleStep3Desc },
    { icon: Wrench, title: p.cycleStep4Title, desc: p.cycleStep4Desc },
    { icon: Undo2, title: p.cycleStep5Title, desc: p.cycleStep5Desc },
    { icon: Wallet, title: p.cycleStep6Title, desc: p.cycleStep6Desc },
  ];

  const stats = [
    { value: p.statActiveUsersValue, label: p.statActiveUsersLabel },
    { value: p.statRentalsValue, label: p.statRentalsLabel },
    { value: p.statSatisfactionValue, label: p.statSatisfactionLabel },
    { value: p.statResponseValue, label: p.statResponseLabel },
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

      {/* Process Timeline (zigzag) */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              {p.processBadge}
            </span>
            <h2 className="mt-4 font-heading text-3xl font-bold text-foreground md:text-4xl">{p.processTitle}</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{p.processSubtitle}</p>
          </div>

          {/* Desktop zigzag */}
          <div className="relative mx-auto hidden max-w-4xl md:block">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-primary/0 via-primary/60 to-primary/0"
            />
            <div className="space-y-14">
              {cycleSteps.map((step, idx) => {
                const left = idx % 2 === 0;
                return (
                  <div key={idx} className="relative grid grid-cols-2 items-center gap-12">
                    {/* Center node */}
                    <span
                      aria-hidden
                      className="absolute left-1/2 top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-background"
                    />

                    {/* Text side */}
                    <div className={cn(left ? "text-right pr-6" : "col-start-2 text-left pl-6")}>
                      <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                        {`PAS · ${String(idx + 1).padStart(2, "0")}`}
                      </span>
                      <h3 className="mt-3 font-heading text-xl font-semibold text-foreground">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                    </div>

                    {/* Icon side */}
                    <div className={cn(left ? "col-start-2 pl-6" : "row-start-1 pr-6")}>
                      <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-card", left ? "" : "ml-auto")}>
                        <step.icon className="h-7 w-7 text-primary" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile vertical */}
          <div className="relative md:hidden">
            <div aria-hidden className="absolute left-5 top-2 h-[calc(100%-1rem)] w-px bg-primary/30" />
            <div className="space-y-6">
              {cycleSteps.map((step, idx) => (
                <div key={idx} className="relative pl-14">
                  <span
                    aria-hidden
                    className="absolute left-5 top-5 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-primary ring-4 ring-background"
                  />
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                        <step.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        {`PAS · ${String(idx + 1).padStart(2, "0")}`}
                      </span>
                    </div>
                    <h3 className="font-heading text-base font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Why users choose us — bento */}
      <WhyChooseUsBento />

      {/* FAQ — redesigned */}
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <div className="mb-10 text-center">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              {p.faqEyebrow}
            </span>
            <h2 className="mt-4 font-heading text-3xl font-bold text-foreground md:text-4xl">{p.faqTitle}</h2>
            <p className="mt-3 text-muted-foreground">{p.faqSubtitle}</p>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-2xl border border-border bg-card px-5 data-[state=open]:border-primary/30 data-[state=open]:bg-secondary/40"
              >
                <AccordionTrigger className="text-left font-heading text-base font-semibold hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA — gradient card */}
      <section className="pb-20">
        <div className="container">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[#F98715] to-[#e8780f] p-10 text-center shadow-card md:p-14">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3), transparent 40%)",
              }}
            />
            <div className="relative">
              <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                {p.ctaEyebrow}
              </span>
              <h2 className="mt-4 font-heading text-3xl font-bold text-white md:text-5xl">{p.ctaTitle}</h2>
              <p className="mx-auto mt-3 max-w-xl text-white/90">{p.ctaSubtitle}</p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="bg-none bg-white text-black hover:bg-white/90 hover:opacity-100">
                  <Link to="/cauta">{p.ctaRent}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <Link to="/adauga-anunt">{p.ctaList}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
