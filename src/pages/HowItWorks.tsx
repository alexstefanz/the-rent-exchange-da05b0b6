import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Send, CheckCircle2, Truck, ClipboardCheck, Package, Undo2, FileCheck2, Trophy, Star,
  Lock, MessageSquare, ShieldCheck, Camera, Clock, AlertTriangle, LifeBuoy, Sparkles,
  ChevronRight, BadgeCheck, Image as ImageIcon, ScrollText, ArrowRight, Search as SearchIcon,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */
const HeroSection = () => {
  const { t } = useLanguage();
  const badges = [
    { icon: Lock, label: t("Plăți securizate", "Secure payments") },
    { icon: BadgeCheck, label: t("Utilizatori verificați", "Verified users") },
    { icon: ScrollText, label: t("Proces verbal digital", "Digital handover report") },
    { icon: LifeBuoy, label: t("Suport dedicat", "Dedicated support") },
  ];
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-secondary/40">
      <div className="absolute inset-0 -z-10 opacity-60 [background:radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/0.18),transparent_70%)]" />
      <div className="container py-14 md:py-24">
        <div className="mx-auto max-w-3xl text-center animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t("Ghidul Rentli", "The Rentli guide")}
          </span>
          <h1 className="mt-4 font-heading text-3xl font-semibold leading-tight text-foreground md:text-5xl">
            {t("Închiriază simplu, sigur și transparent", "Rent simply, safely and transparently")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            {t(
              "Rentli te ajută să închiriezi produse de la oameni verificați, cu plăți securizate, proces verbal digital și suport dedicat.",
              "Rentli helps you rent items from verified people, with secure payments, a digital handover report and dedicated support."
            )}
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/cauta">{t("Caută produse", "Browse rentals")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/adauga-anunt">{t("Listează gratuit", "List for free")}</Link>
            </Button>
          </div>
        </div>
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
          {badges.map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 backdrop-blur-sm shadow-card"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <b.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground md:text-sm">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Lifecycle Timeline (10 steps)                                       */
/* ------------------------------------------------------------------ */
const useLifecycleSteps = () => {
  const { t } = useLanguage();
  return [
    { icon: Search,         title: t("Alegi produsul", "Choose the item") },
    { icon: Send,           title: t("Trimiți cererea", "Send the request") },
    { icon: CheckCircle2,   title: t("Proprietarul aprobă", "Owner approves") },
    { icon: Truck,          title: t("Predarea produsului", "Item handover") },
    { icon: ClipboardCheck, title: t("Proces verbal predare", "Handover report"), highlight: true },
    { icon: Package,        title: t("Folosești produsul", "Use the item") },
    { icon: Undo2,          title: t("Returnezi produsul", "Return the item") },
    { icon: FileCheck2,     title: t("Proces verbal returnare", "Return report"), highlight: true },
    { icon: Trophy,         title: t("Închirierea se finalizează", "Rental completes") },
    { icon: Star,           title: t("Lași review", "Leave a review") },
  ];
};

const LifecycleTimeline = () => {
  const { t } = useLanguage();
  const steps = useLifecycleSteps();
  return (
    <section className="py-14 md:py-20">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
            {t("Cum decurge o închiriere", "How a rental flows")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t(
              "10 pași clari, urmăriți live în dashboard, de la căutare până la review.",
              "10 clear steps, tracked live in your dashboard, from search to review."
            )}
          </p>
        </div>

        {/* Mobile vertical */}
        <ol className="md:hidden mx-auto max-w-md space-y-3">
          {steps.map((s, i) => (
            <li
              key={i}
              className="relative flex gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-card animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex flex-col items-center">
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold",
                  s.highlight ? "bg-primary text-primary-foreground shadow-card-hover" : "bg-primary/10 text-primary"
                )}>
                  {i + 1}
                </div>
                {i < steps.length - 1 && <div className="mt-1 h-full w-0.5 bg-gradient-to-b from-primary/40 to-primary/0" />}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2">
                  <s.icon className="h-4 w-4 text-primary" />
                  <span className="font-heading text-sm font-semibold text-foreground">{s.title}</span>
                </div>
                {s.highlight && (
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    <Camera className="h-3 w-3" /> {t("Poze obligatorii", "Photos required")}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>

        {/* Desktop horizontal */}
        <div className="hidden md:block">
          <div className="relative">
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-gradient-to-r from-primary/40 via-primary/30 to-primary/40" />
            <div className="relative grid grid-cols-5 gap-3 lg:grid-cols-10">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-center animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className={cn(
                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full font-heading text-sm font-bold ring-4 ring-background",
                    s.highlight ? "bg-primary text-primary-foreground shadow-card-hover" : "bg-card text-primary border-2 border-primary/40"
                  )}>
                    {i + 1}
                  </div>
                  <div className="mt-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-2 px-1 text-xs font-medium leading-tight text-foreground">{s.title}</p>
                  {s.highlight && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                      <Camera className="h-2.5 w-2.5" /> {t("Foto", "Photo")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Role flows (Tabs)                                                    */
/* ------------------------------------------------------------------ */
const FlowList = ({ items, note }: { items: string[]; note: string }) => (
  <div className="grid gap-3 md:grid-cols-2">
    {items.map((label, i) => (
      <div
        key={i}
        className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {i + 1}
        </div>
        <p className="text-sm leading-relaxed text-foreground">{label}</p>
      </div>
    ))}
    <div className="md:col-span-2 mt-2 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <Camera className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <p className="text-sm leading-relaxed text-foreground">{note}</p>
    </div>
  </div>
);

const RoleFlowsTabs = () => {
  const { t } = useLanguage();
  const tenantSteps = [
    t("Caută produsul dorit", "Search for the item you want"),
    t("Alege perioada de închiriere", "Pick your rental period"),
    t("Trimite cererea către proprietar", "Send the request to the owner"),
    t("Așteaptă aprobarea proprietarului", "Wait for the owner's approval"),
    t("Confirmă primirea produsului", "Confirm receiving the item"),
    t("Completează procesul verbal cu poze", "Fill in the handover report with photos"),
    t("Folosește produsul în siguranță", "Use the item safely"),
    t("Returnează produsul la timp", "Return the item on time"),
    t("Confirmă returnarea", "Confirm the return"),
    t("Lasă review pentru proprietar", "Leave a review for the owner"),
  ];
  const ownerSteps = [
    t("Publică anunțul gratuit", "Publish your listing for free"),
    t("Primește cereri de rezervare", "Receive booking requests"),
    t("Acceptă sau refuză cererea", "Accept or decline the request"),
    t("Predă produsul chiriașului", "Hand the item over to the renter"),
    t("Verifică procesul verbal de predare", "Check the handover report"),
    t("Monitorizează închirierea în timeline", "Monitor the rental in the timeline"),
    t("Primește produsul înapoi", "Receive the item back"),
    t("Completează procesul verbal de returnare", "Fill in the return report"),
    t("Confirmă finalizarea închirierii", "Confirm the rental completion"),
    t("Primește banii în balanță", "Get paid into your balance"),
  ];
  return (
    <section className="border-t border-border bg-secondary/30 py-14 md:py-20">
      <div className="container">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
            {t("Flow detaliat pe rol", "Detailed flow by role")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t("Alege rolul tău și vezi exact ce ai de făcut.", "Pick your role and see exactly what to do.")}
          </p>
        </div>
        <Tabs defaultValue="renter" className="mx-auto max-w-4xl">
          <TabsList className="mx-auto mb-6 grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="renter">{t("Pentru chiriași", "For renters")}</TabsTrigger>
            <TabsTrigger value="owner">{t("Pentru proprietari", "For owners")}</TabsTrigger>
          </TabsList>
          <TabsContent value="renter">
            <FlowList
              items={tenantSteps}
              note={t(
                "Pozele de predare și returnare ajută la protejarea ambelor părți în cazul unei dispute.",
                "Handover and return photos protect both parties in case of a dispute."
              )}
            />
          </TabsContent>
          <TabsContent value="owner">
            <FlowList
              items={ownerSteps}
              note={t(
                "Închirierea se finalizează doar după ce procesul verbal de returnare este completat.",
                "The rental is only completed after the return report has been filled in."
              )}
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Digital handover                                                    */
/* ------------------------------------------------------------------ */
const DigitalHandoverSection = () => {
  const { t } = useLanguage();
  const points = [
    t("Poze obligatorii la predare", "Mandatory photos at handover"),
    t("Poze obligatorii la returnare", "Mandatory photos at return"),
    t("Checklist confirmă starea produsului", "Checklist confirms the item's condition"),
    t("Observații obligatorii dacă există probleme", "Mandatory notes if any issues are found"),
    t("Datele sunt salvate cu timestamp", "Everything is saved with a timestamp"),
    t("Dovadă utilă în caz de dispută", "Proof you can rely on in case of a dispute"),
  ];
  return (
    <section className="border-t border-border py-14 md:py-20">
      <div className="container grid items-center gap-10 lg:grid-cols-2">
        <div>
          <Badge variant="secondary" className="mb-3">{t("Nou", "New")}</Badge>
          <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
            {t("Proces verbal digital pentru siguranță", "A digital handover report for safety")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t(
              "La fiecare predare și returnare, ambele părți completează un proces verbal digital cu poze și observații. Totul este salvat automat și folosit ca dovadă în caz de dispută.",
              "On every handover and return, both parties fill in a digital report with photos and notes. Everything is auto-saved and used as proof in case of a dispute."
            )}
          </p>
          <ul className="mt-6 space-y-3">
            {points.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm leading-relaxed text-foreground">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Mock card */}
        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent blur-2xl" />
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card-hover">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <ScrollText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-heading text-sm font-semibold text-foreground">
                    {t("Proces verbal predare", "Handover report")}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> {t("Acum 2 minute", "2 minutes ago")}
                  </div>
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {t("Salvat automat", "Auto-saved")}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-gradient-to-br from-secondary to-muted/60 flex items-center justify-center"
                >
                  <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {[
                t("Aspect exterior verificat", "Exterior condition verified"),
                t("Accesorii prezente", "Accessories present"),
                t("Funcționare testată", "Operation tested"),
              ].map((label, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-xs text-foreground">
                {t("Dovadă criptată cu timestamp", "Encrypted proof with timestamp")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Reusable info card section                                          */
/* ------------------------------------------------------------------ */
type InfoCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  bg?: "default" | "muted";
};
const InfoCardSection = ({ icon: Icon, eyebrow, title, description, bullets, bg = "default" }: InfoCardProps) => (
  <section className={cn("border-t border-border py-14 md:py-20", bg === "muted" && "bg-secondary/30")}>
    <div className="container max-w-4xl">
      <div className="grid gap-8 md:grid-cols-[auto,1fr]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-primary">{eyebrow}</span>
          <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground md:text-3xl">{title}</h2>
          <p className="mt-3 text-muted-foreground">{description}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl border border-border/60 bg-card p-3 shadow-card">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm leading-relaxed text-foreground">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Trust grid                                                          */
/* ------------------------------------------------------------------ */
const TrustGrid = () => {
  const { t } = useLanguage();
  const items = [
    { icon: BadgeCheck,    title: t("Utilizatori verificați", "Verified users"),   desc: t("Verificare KYC pentru fiecare cont.", "KYC verification on every account.") },
    { icon: ScrollText,    title: t("Proces verbal digital", "Digital report"),    desc: t("Predare și returnare documentate.", "Documented handover and return.") },
    { icon: Camera,        title: t("Poze obligatorii", "Mandatory photos"),       desc: t("Dovadă vizuală a stării produsului.", "Visual proof of the item's condition.") },
    { icon: Lock,          title: t("Plăți securizate", "Secure payments"),        desc: t("Stripe escrow, fonduri blocate până la predare.", "Stripe escrow, funds held until handover.") },
    { icon: MessageSquare, title: t("Chat în platformă", "In-app chat"),           desc: t("Conversațiile rămân ca dovadă.", "Conversations stay as proof.") },
    { icon: LifeBuoy,      title: t("Suport dedicat", "Dedicated support"),        desc: t("Echipa Rentli te ajută la orice oră.", "The Rentli team helps you anytime.") },
    { icon: Star,          title: t("Review-uri verificate", "Verified reviews"),  desc: t("Doar după închirieri reale finalizate.", "Only after real completed rentals.") },
  ];
  return (
    <section className="border-t border-border py-14 md:py-20">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
            {t("De ce este Rentli sigur?", "Why is Rentli safe?")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t("Șapte mecanisme care lucrează împreună pentru fiecare închiriere.", "Seven mechanisms that work together on every rental.")}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <it.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">{it.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* FAQ with search + category tabs                                     */
/* ------------------------------------------------------------------ */
type FaqCategory = "all" | "renters" | "owners" | "payments" | "disputes";
const FaqSection = () => {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FaqCategory>("all");

  const faqs: Array<{ q: string; a: string; category: Exclude<FaqCategory, "all"> }> = [
    { category: "renters",  q: t("Cum funcționează procesul verbal?", "How does the handover report work?"),
      a: t("La predare și la returnare, ambele părți completează un checklist și încarcă poze obligatorii. Datele sunt salvate cu timestamp și pot fi folosite ca dovadă oficială.", "At handover and return, both parties fill a checklist and upload mandatory photos. Data is timestamped and can be used as official proof.") },
    { category: "renters",  q: t("Sunt pozele obligatorii?", "Are the photos mandatory?"),
      a: t("Da. Fără pozele de predare și de returnare, închirierea nu poate fi marcată ca finalizată. Acest pas protejează ambele părți.", "Yes. Without handover and return photos, the rental cannot be marked complete. This step protects both parties.") },
    { category: "payments", q: t("Când primește proprietarul banii?", "When does the owner get paid?"),
      a: t("Banii sunt eliberați după ce procesul verbal de returnare este completat și închirierea este finalizată cu succes. Suma apare în balanță și poate fi retrasă în cont.", "Funds are released after the return report is completed and the rental is successfully finalized. The amount appears in your balance and can be withdrawn.") },
    { category: "disputes", q: t("Ce se întâmplă dacă produsul este deteriorat?", "What if the item is damaged?"),
      a: t("Deschizi un ticket de suport. Echipa noastră analizează procesul verbal, pozele, chat-ul și aplică politica de despăgubire. Plata poate fi blocată temporar până la soluționare.", "Open a support ticket. Our team reviews the report, photos, chat and applies the compensation policy. Payout may be paused until resolved.") },
    { category: "disputes", q: t("Ce se întâmplă dacă una dintre părți nu confirmă?", "What if one party doesn't confirm?"),
      a: t("Suportul intervine și solicită dovezi suplimentare. Procesul verbal și pozele sunt esențiale pentru a stabili rapid faptele.", "Support steps in and requests further evidence. The report and the photos are key to quickly establishing the facts.") },
    { category: "disputes", q: t("Cum deschid o dispută?", "How do I open a dispute?"),
      a: t("Din pagina închirierii, apasă pe butonul de suport. Se creează automat un ticket cu toate datele relevante atașate.", "On the rental page, press the support button. A ticket is automatically created with all relevant data attached.") },
    { category: "renters",  q: t("Pot anula o rezervare?", "Can I cancel a booking?"),
      a: t("Da. Anulare gratuită cu 48h înainte de start, 50% rambursare sub 48h. După începerea închirierii nu se mai oferă rambursare.", "Yes. Free cancellation 48h before start, 50% refund under 48h. After the rental starts, no refund is offered.") },
    { category: "renters",  q: t("Este obligatorie verificarea identității?", "Is identity verification mandatory?"),
      a: t("Da, pentru a închiria sau a lista un produs. Verificarea KYC durează doar câteva minute.", "Yes, in order to rent or list an item. KYC verification only takes a few minutes.") },
    { category: "renters",  q: t("De ce este recomandat să comunic în platformă?", "Why should I keep chat inside the platform?"),
      a: t("Mesajele rămân ca dovadă în caz de dispută și suportul le poate analiza. În afara platformei, nu te putem ajuta.", "Messages remain as proof in case of a dispute and support can review them. Outside the platform, we can't help you.") },
    { category: "owners",   q: t("Cum las un review?", "How do I leave a review?"),
      a: t("După finalizarea închirierii, primești o invitație de a evalua cealaltă parte după mai multe criterii.", "After the rental is completed, you receive an invitation to rate the other party across several criteria.") },
  ];

  const tabs: Array<{ value: FaqCategory; label: string }> = [
    { value: "all",      label: t("Toate", "All") },
    { value: "renters",  label: t("Chiriași", "Renters") },
    { value: "owners",   label: t("Proprietari", "Owners") },
    { value: "payments", label: t("Plăți", "Payments") },
    { value: "disputes", label: t("Dispute", "Disputes") },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter((f) => {
      const matchCat = category === "all" || f.category === category;
      const matchQ = !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category]);

  return (
    <section className="border-t border-border bg-secondary/30 py-14 md:py-20">
      <div className="container max-w-3xl">
        <div className="mb-8 text-center">
          <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
            {t("Întrebări frecvente", "Frequently asked questions")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t("Caută rapid sau filtrează pe categorii.", "Search quickly or filter by category.")}
          </p>
        </div>

        <div className="relative mb-4">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Caută o întrebare…", "Search a question…")}
            className="h-11 pl-9"
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((tb) => (
            <button
              key={tb.value}
              type="button"
              onClick={() => setCategory(tb.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                category === tb.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              )}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {t("Nicio întrebare nu corespunde căutării.", "No question matches your search.")}
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full rounded-2xl border border-border bg-card px-4 shadow-card">
            {filtered.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border/60 last:border-0">
                <AccordionTrigger className="text-left font-heading text-base">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Final CTA + sticky mobile CTA                                       */
/* ------------------------------------------------------------------ */
const FinalCta = () => {
  const { t } = useLanguage();
  return (
    <section className="border-t border-border bg-gradient-to-br from-primary/10 via-background to-secondary/40 py-16 md:py-20">
      <div className="container max-w-2xl text-center">
        <h2 className="font-heading text-2xl font-semibold text-foreground md:text-4xl">
          {t("Gata să începi?", "Ready to get started?")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          {t(
            "Închiriază mai sigur, mai simplu și mai transparent cu Rentli.",
            "Rent more safely, simply and transparently with Rentli."
          )}
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/cauta" className="inline-flex items-center gap-2">
              {t("Caută produse", "Browse rentals")} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/adauga-anunt">{t("Listează gratuit", "List for free")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

const StickyMobileCta = () => {
  const { t } = useLanguage();
  return (
    <div
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
    >
      <div className="flex gap-2">
        <Button asChild size="sm" className="h-11 flex-1">
          <Link to="/cauta">{t("Caută produse", "Browse")}</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-11 flex-1">
          <Link to="/adauga-anunt">{t("Listează", "List")}</Link>
        </Button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
const HowItWorks = () => {
  const { t } = useLanguage();

  useSEO({
    title: t("Cum funcționează Rentli — închirieri sigure", "How Rentli works — safe rentals"),
    description: t(
      "Ghid pas cu pas: rezervare, plată în escrow, proces verbal digital, chat în platformă, suport și politică de dispute pe Rentli.",
      "Step-by-step guide: booking, escrow payment, digital handover report, in-app chat, support and dispute policy on Rentli."
    ),
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container pt-4 md:pt-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/">{t("Acasă", "Home")}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("Cum funcționează", "How it works")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <HeroSection />
      <LifecycleTimeline />
      <RoleFlowsTabs />
      <DigitalHandoverSection />

      <InfoCardSection
        icon={Lock}
        eyebrow={t("Plăți & garanție", "Payments & escrow")}
        title={t("Banii tăi, în siguranță", "Your money, kept safe")}
        description={t(
          "Folosim Stripe pentru a procesa plățile. Banii sunt blocați la rezervare și eliberați doar după finalizarea cu succes a închirierii.",
          "We use Stripe to process payments. Funds are held at booking and released only after the rental successfully completes."
        )}
        bullets={[
          t("Plata este procesată securizat prin Stripe", "Payments are processed securely via Stripe"),
          t("Banii sunt blocați până la confirmarea predării", "Funds are held until handover is confirmed"),
          t("Proprietarul primește banii după finalizare", "Owner gets paid after the rental completes"),
          t("Anulările respectă politica platformei", "Cancellations follow the platform policy"),
          t("Disputele pot bloca temporar plata", "Disputes may pause payouts until resolved"),
          t("Fără surprize, totul este afișat clar", "No surprises, everything is shown upfront"),
        ]}
        bg="muted"
      />

      <InfoCardSection
        icon={MessageSquare}
        eyebrow={t("Comunicare", "Communication")}
        title={t("Comunicare în siguranță", "Safe communication")}
        description={t(
          "Toate conversațiile au loc în Rentli. Astfel suportul poate interveni rapid și ai mereu o dovadă a discuțiilor.",
          "All conversations happen inside Rentli. Support can step in fast and you always have proof of what was said."
        )}
        bullets={[
          t("Chat direct între chiriaș și proprietar", "Direct chat between renter and owner"),
          t("Recomandăm păstrarea discuției în Rentli", "We recommend keeping the chat inside Rentli"),
          t("Util pentru suport în caz de dispută", "Useful for support in case of a dispute"),
          t("Linkurile suspecte sunt marcate automat", "Suspicious links are flagged automatically"),
          t("Poți trimite poze relevante în chat", "You can send relevant photos in chat"),
          t("Notificări în timp real", "Real-time notifications"),
        ]}
      />

      <InfoCardSection
        icon={LifeBuoy}
        eyebrow={t("Suport & dispute", "Support & disputes")}
        title={t("Ai nevoie de ajutor?", "Need help?")}
        description={t(
          "Echipa noastră este aici să te asiste rapid. AI Assistant răspunde la întrebări frecvente, iar suportul uman analizează disputele.",
          "Our team is here to help fast. The AI Assistant handles common questions while human support reviews disputes."
        )}
        bullets={[
          t("Deschizi un ticket cu un click", "Open a ticket in one click"),
          t("AI Assistant pentru răspunsuri rapide", "AI Assistant for fast answers"),
          t("Analizăm rezervarea, timeline-ul și chat-ul", "We review the booking, timeline and chat"),
          t("Procesul verbal este parte din dovadă", "The handover report is part of the evidence"),
          t("Decizii corecte, bazate pe date", "Fair decisions based on data"),
          t("Răspuns prompt din partea echipei", "Prompt response from our team"),
        ]}
        bg="muted"
      />

      <TrustGrid />
      <FaqSection />
      <FinalCta />

      <Footer />
      <div className="h-16 md:hidden" aria-hidden />
      <StickyMobileCta />
    </div>
  );
};

export default HowItWorks;