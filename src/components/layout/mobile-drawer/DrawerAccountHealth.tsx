import { Link } from "react-router-dom";
import { Check, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  emailVerified: boolean;
  hasPhone: boolean;
  hasIban: boolean;
  onNavigate: () => void;
}

export function DrawerAccountHealth({ emailVerified, hasPhone, hasIban, onNavigate }: Props) {
  const { t } = useLanguage();
  const items = [
    { ok: emailVerified, label: t("Email verificat", "Email verified") },
    { ok: hasPhone, label: t("Telefon adăugat", "Phone added") },
    { ok: hasIban, label: t("Cont bancar (IBAN)", "Bank account (IBAN)") },
  ];
  const completed = items.filter((i) => i.ok).length;
  const total = items.length;
  const allGood = completed === total;

  if (allGood) return null;

  return (
    <section className="px-2">
      <div className="flex items-center justify-between px-3 mb-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("Sănătate cont", "Account health")}
        </h3>
        <span className="text-[10px] font-semibold text-muted-foreground">
          {completed}/{total}
        </span>
      </div>
      <Link
        to="/profile"
        onClick={onNavigate}
        className="block rounded-xl border border-border/60 bg-card p-3 transition-all hover:border-primary/40 active:scale-[.99]"
      >
        <ul className="flex flex-col gap-1.5">
          {items.map((it) => (
            <li key={it.label} className="flex items-center gap-2 text-[12.5px]">
              {it.ok ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              )}
              <span className={it.ok ? "text-muted-foreground" : "text-foreground font-medium"}>
                {it.label}
              </span>
            </li>
          ))}
        </ul>
      </Link>
    </section>
  );
}