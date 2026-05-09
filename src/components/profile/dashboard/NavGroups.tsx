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
  HelpCircle,
  LifeBuoy,
  ScrollText,
  ChevronRight,
  Package,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Item {
  to: string;
  icon: React.ElementType;
  ro: string;
  en: string;
}

interface Group {
  ro: string;
  en: string;
  items: Item[];
}

const GROUPS: Group[] = [
  {
    ro: "Activitate",
    en: "Activity",
    items: [
      { to: "/rezervari", icon: ShoppingBag, ro: "Rezervări", en: "Reservations" },
      { to: "/inchirieri", icon: PackageCheck, ro: "Închirieri", en: "Lendings" },
      { to: "/anunturi", icon: Package, ro: "Anunțuri", en: "Listings" },
      { to: "/favorite", icon: Heart, ro: "Favorite", en: "Favorites" },
      { to: "/mesaje", icon: MessageCircle, ro: "Mesaje", en: "Messages" },
      { to: "/activitate", icon: ScrollText, ro: "Istoric activitate", en: "Activity log" },
    ],
  },
  {
    ro: "Cont",
    en: "Account",
    items: [
      { to: "/contul-meu", icon: UserCog, ro: "Detalii cont", en: "Account details" },
      { to: "/verificare", icon: ShieldCheck, ro: "Verificare identitate", en: "Identity verification" },
      { to: "/castiguri", icon: Wallet, ro: "Plăți & câștiguri", en: "Payments & earnings" },
      { to: "/notificari", icon: Bell, ro: "Notificări", en: "Notifications" },
    ],
  },
  {
    ro: "Suport",
    en: "Support",
    items: [
      { to: "/centru-asistenta", icon: HelpCircle, ro: "Centrul de ajutor", en: "Help center" },
      { to: "/suport", icon: LifeBuoy, ro: "Tichetele mele", en: "My tickets" },
    ],
  },
];

export function NavGroups() {
  const { language } = useLanguage();
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {GROUPS.map((g) => (
        <div key={g.ro} className="rounded-[12px] border bg-card p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            {language === "ro" ? g.ro : g.en}
          </h3>
          <ul className="space-y-1">
            {g.items.map((it) => {
              const Icon = it.icon;
              return (
                <li key={it.to}>
                  <Link
                    to={it.to}
                    className="group flex items-center justify-between gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex items-center gap-3 text-sm">
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="font-medium">{language === "ro" ? it.ro : it.en}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}