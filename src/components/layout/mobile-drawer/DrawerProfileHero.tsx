import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, ShieldAlert, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  initials: string;
  activeRentals: number;
  onNavigate: () => void;
}

export function DrawerProfileHero({
  fullName,
  email,
  avatarUrl,
  initials,
  activeRentals,
  onNavigate,
}: Props) {
  const { t } = useLanguage();
  const verified = false;

  return (
    <Link
      to="/profile"
      onClick={onNavigate}
      className="group block rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 transition-all hover:border-primary/40 hover:shadow-md active:scale-[.99]"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-14 w-14 ring-2 ring-background shadow-sm">
            <AvatarImage src={avatarUrl || undefined} alt={fullName} />
            <AvatarFallback className="bg-primary/15 text-primary font-semibold text-base">
              {initials}
            </AvatarFallback>
          </Avatar>
          {verified && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
              <ShieldCheck className="h-3 w-3 text-white" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-foreground">{fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          <div className="mt-1.5 flex items-center gap-2">
            {verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <ShieldCheck className="h-3 w-3" />
                {t("Verificat", "Verified")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <ShieldAlert className="h-3 w-3" />
                {t("Neverificat", "Unverified")}
              </span>
            )}
            {activeRentals > 0 && (
              <span className="text-[10px] font-medium text-muted-foreground">
                · {activeRentals}{" "}
                {t(activeRentals === 1 ? "rezervare activă" : "rezervări active",
                   activeRentals === 1 ? "active rental" : "active rentals")}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}