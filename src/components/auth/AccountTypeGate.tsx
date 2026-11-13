import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PENDING_KEY = "rentli_pending_business";
const chosenKey = (id: string) => `rentli_account_type_chosen_${id}`;
const NEW_ACCOUNT_WINDOW_MS = 30 * 60 * 1000;

/**
 * After Google/Apple sign-in: honours a "company" choice made before the
 * redirect, and asks brand-new social accounts which account type they want.
 */
const AccountTypeGate = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || location.pathname.startsWith("/auth") || location.pathname.startsWith("/onboarding")) return;
    const provider = (user.app_metadata as any)?.provider;
    const isSocial = provider && provider !== "email" && provider !== "phone";
    if (!isSocial) return;
    if (localStorage.getItem(PENDING_KEY) === "1") {
      localStorage.removeItem(PENDING_KEY);
      localStorage.setItem(chosenKey(user.id), "1");
      navigate("/onboarding/business", { replace: true });
      return;
    }
    if (localStorage.getItem(chosenKey(user.id))) return;
    const created = new Date(user.created_at).getTime();
    if (Date.now() - created < NEW_ACCOUNT_WINDOW_MS) setOpen(true);
    else localStorage.setItem(chosenKey(user.id), "1");
  }, [user, location.pathname, navigate]);

  if (!user) return null;

  const choose = (type: "individual" | "business") => {
    localStorage.setItem(chosenKey(user.id), "1");
    setOpen(false);
    if (type === "business") navigate("/onboarding/business");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) choose("individual"); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Bun venit pe Rentli!", "Welcome to Rentli!")}</DialogTitle>
          <DialogDescription>{t("Cum dorești să folosești platforma?", "How would you like to use the platform?")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {([
            ["individual", "👤", t("Persoană fizică", "Individual"), t("Uz personal", "Personal use")],
            ["business", "🏢", t("Persoană juridică", "Company"), t("Firmă / business", "Business")],
          ] as const).map(([val, icon, label, sub]) => (
            <button key={val} type="button" onClick={() => choose(val)}
              className="rounded-xl border-2 border-border p-4 text-center transition-colors hover:border-primary hover:bg-primary/10">
              <span className="block text-2xl mb-1">{icon}</span>
              <span className="block text-sm font-semibold text-foreground">{label}</span>
              <span className="block text-xs text-muted-foreground">{sub}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountTypeGate;
