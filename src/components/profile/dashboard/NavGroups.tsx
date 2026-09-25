import { Link } from "react-router-dom";
import {
  ShoppingBag,
  PackageCheck,
  Heart,
  MessageCircle,
  UserCog,
  ShieldCheck,
  Wallet,
  Bell,
  LifeBuoy,
  ScrollText,
  ChevronRight,
  Package,
  User as UserIcon,
  Store,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Item {
  to: string;
  icon: React.ElementType;
  ro: string;
  en: string;
  hintRo?: string;
  hintEn?: string;
}

interface Group {
  ro: string;
  en: string;
  icon?: React.ElementType;
  tone?: "renter" | "owner" | "default";
  items: Item[];
}

const GROUPS: Group[] = [
  {
    ro: "Ca chiriaș",
    en: "As renter",
    icon: UserIcon,
    tone: "renter",
    items: [
      {
        to: "/rezervari",
        icon: ShoppingBag,
        ro: "Închirierile mele",
        en: "My rentals",
        hintRo: "Produse pe care le-ai închiriat",
        hintEn: "Products you have rented",
      },
      {
        to: "/favorite",
        icon: Heart,
        ro: "Favorite",
        en: "Favorites",
      },
      {
        to: "/mesaje",
        icon: MessageCircle,
        ro: "Mesaje",
        en: "Messages",
      },
      {
        to: "/activitate",
        icon: ScrollText,
        ro: "Istoric activitate",
        en: "Activity log",
      },
    ],
  },
  {
    ro: "Ca proprietar",
    en: "As owner",
    icon: Store,
    tone: "owner",
    items: [
      {
        to: "/anunturi",
        icon: Package,
        ro: "Anunțurile mele",
        en: "My listings",
        hintRo: "Produsele pe care le închiriezi",
        hintEn: "Products you rent out",
      },
      {
        to: "/anunturi?tab=cereri",
        icon: PackageCheck,
        ro: "Cereri primite",
        en: "Bookings received",
        hintRo: "Rezervări pentru anunțurile tale",
        hintEn: "Bookings on your listings",
      },
      {
        to: "/inchirieri",
        icon: ScrollText,
        ro: "Istoric închirieri",
        en: "Rental history",
        hintRo: "Toate închirierile anunțurilor tale",
        hintEn: "All bookings on your listings",
      },
      {
        to: "/castiguri",
        icon: Wallet,
        ro: "Câștiguri & retrageri",
        en: "Earnings & payouts",
      },
    ],
  },
  {
    ro: "Cont & suport",
    en: "Account & support",
    items: [
      { to: "/contul-meu", icon: UserCog, ro: "Detalii cont", en: "Account details" },
      { to: "/verificare", icon: ShieldCheck, ro: "Verificare identitate", en: "Identity verification" },
      { to: "/notificari", icon: Bell, ro: "Notificări", en: "Notifications" },
      { to: "/suport", icon: LifeBuoy, ro: "Tichetele mele", en: "My tickets" },
    ],
  },
];

export function NavGroups() {
  const { language } = useLanguage();
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {GROUPS.map((g) => {
        const GIcon = g.icon;
        const headerTone =
          g.tone === "renter"
            ? "bg-renter/10 text-renter"
            : g.tone === "owner"
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground";
        return (
          <div key={g.ro} className="rounded-[12px] border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              {GIcon && (
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${headerTone}`}>
                  <GIcon className="h-3.5 w-3.5" />
                </span>
              )}
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {language === "ro" ? g.ro : g.en}
              </h3>
            </div>
            <ul className="space-y-1">
              {g.items.map((it) => {
                const Icon = it.icon;
                const hint = language === "ro" ? it.hintRo : it.hintEn;
                return (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      className="group flex items-center justify-between gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-muted/50 transition-colors"
                    >
                      <span className="flex items-start gap-3 text-sm min-w-0">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="min-w-0">
                          <span className="block font-medium leading-tight">
                            {language === "ro" ? it.ro : it.en}
                          </span>
                          {hint && (
                            <span className="block text-muted-foreground leading-tight text-sm font-semibold text-black mt-0.5">
                              {hint}
                            </span>
                          )}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}