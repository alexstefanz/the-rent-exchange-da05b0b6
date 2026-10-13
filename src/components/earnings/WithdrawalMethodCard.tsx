import { useState } from "react";
import { Landmark, Plus, ShieldCheck, Trash2, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { PayoutMethod } from "@/hooks/useEarnings";

const maskIban = (iban: string) => {
  const clean = iban.replace(/\s/g, "");
  if (clean.length < 8) return clean;
  const first = clean.slice(0, 4);
  const last = clean.slice(-4);
  const mid = "•••• •••• ••••";
  return `${first} ${mid} ${last}`;
};

export const WithdrawalMethodCard = ({ method }: { method: PayoutMethod | null }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newIban, setNewIban] = useState("");
  const [saving, setSaving] = useState(false);

  const ibanRegex = /^RO[0-9]{2}[A-Z0-9]{20}$/;

  const handleAdd = async () => {
    if (!user) return;
    const clean = newIban.toUpperCase().replace(/\s/g, "");
    if (!ibanRegex.test(clean)) {
      toast.error(t("IBAN invalid (RO + 22 caractere).", "Invalid IBAN (RO + 22 chars)."));
      return;
    }
    setSaving(true);
    try {
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (pErr) throw pErr;
      const fullName = (profile?.full_name || "").trim();
      if (!fullName || fullName.length < 3) {
        toast.error(t(
          "Completează mai întâi numele complet în Contul meu.",
          "Please fill in your full name in My account first."
        ));
        setSaving(false);
        return;
      }
      const { count } = await supabase
        .from("payout_ibans" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if ((count ?? 0) >= 3) {
        toast.error(t("Poți avea maxim 3 IBAN-uri salvate.", "You can save up to 3 IBANs."));
        setSaving(false);
        return;
      }
      const { error } = await supabase
        .from("payout_ibans" as any)
        .insert({
          user_id: user.id,
          iban: clean,
          account_holder_name: fullName,
          is_default: (count ?? 0) === 0,
        } as any);
      if (error) throw error;
      // Fire-and-forget IBAN added confirmation email
      try {
        const maskedIban = clean.length >= 6
          ? `${clean.slice(0, 4)} **** **** **** **** ${clean.slice(-4)}`
          : clean;
        if (user.email) {
          supabase.functions.invoke("send-account-email", {
            body: { event: "iban-added", maskedIban, holderName: fullName },
          }).catch((e) => console.error("iban-added email failed:", e));
        }
      } catch (e) { console.error(e); }
      toast.success(t("IBAN adăugat", "IBAN added"));
      setNewIban("");
      setAddOpen(false);
      qc.invalidateQueries({ queryKey: ["earnings"] });
      qc.invalidateQueries({ queryKey: ["walletBalance"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e: any) {
      const msg = e?.message || "";
      toast.error(
        msg.includes("duplicate")
          ? t("IBAN-ul este deja salvat.", "This IBAN is already saved.")
          : msg || t("Nu s-a putut salva IBAN-ul.", "Could not save IBAN.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data: pending, error: pendingErr } = await supabase
        .from("withdrawal_requests" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .limit(1);
      if (pendingErr) throw pendingErr;
      if (pending && pending.length > 0) {
        toast.error(t(
          "Ai o cerere de retragere în așteptare. Așteaptă procesarea ei înainte să ștergi IBAN-ul.",
          "You have a pending withdrawal request. Wait for it to be processed before deleting your IBAN."
        ));
        setConfirmOpen(false);
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .update({ iban: null, account_holder_name: null } as any)
        .eq("id", user.id);
      if (error) throw error;
      toast.success(t("IBAN șters", "IBAN deleted"));
      setConfirmOpen(false);
      qc.invalidateQueries({ queryKey: ["earnings"] });
      qc.invalidateQueries({ queryKey: ["walletBalance"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e: any) {
      console.error(e);
      toast.error(t("Nu s-a putut șterge IBAN-ul", "Could not delete IBAN"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">{t("Metoda de retragere", "Withdrawal method")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("Banii vor fi trimiși aici", "Funds will be sent here")}
          </p>
        </div>
      </div>

      {method ? (
        <div className="flex items-start sm:items-center gap-4 rounded-xl border bg-muted/30 p-4 flex-col sm:flex-row">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold">IBAN</span>
              <Badge variant="secondary" className="text-[10px] h-5">
                {t("Implicit", "Default")}
              </Badge>
            </div>
            <p className="font-mono text-sm tracking-wide truncate">{maskIban(method.iban)}</p>
            {method.accountHolder && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{method.accountHolder}</p>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {t("Adaugă", "Add")}
          </Button>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                {t("Șterge", "Delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("Șterge IBAN-ul?", "Delete IBAN?")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t(
                    "După ștergere nu vei mai putea solicita retrageri până când adaugi un alt IBAN.",
                    "After deletion you won't be able to request withdrawals until you add a new IBAN."
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>{t("Anulează", "Cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => { e.preventDefault(); handleDelete(); }}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("Se șterge...", "Deleting...")}</> : t("Șterge IBAN", "Delete IBAN")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-6 text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <p className="font-medium text-sm mb-1">
            {t("Adaugă o metodă de retragere", "Add a withdrawal method")}
          </p>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
            {t(
              "Pentru a primi banii din închirieri trebuie să adaugi un IBAN.",
              "To receive funds from rentals you must add an IBAN."
            )}
          </p>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {t("Adaugă IBAN", "Add IBAN")}
          </Button>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        <span>{t("Datele tale bancare sunt criptate și protejate.", "Your bank details are encrypted and protected.")}</span>
      </div>

      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setNewIban(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Adaugă IBAN", "Add IBAN")}</DialogTitle>
            <DialogDescription>
              {t(
                "IBAN-ul trebuie să fie pe numele titularului contului. Poți salva până la 3 IBAN-uri.",
                "The IBAN must be in the account holder's name. You can save up to 3 IBANs."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-iban">IBAN</Label>
            <Input
              id="new-iban"
              value={newIban}
              onChange={(e) => setNewIban(e.target.value.toUpperCase())}
              placeholder="RO49 AAAA 1B31 0075 9384 0000"
              className="font-mono tracking-wide"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
              {t("Anulează", "Cancel")}
            </Button>
            <Button onClick={handleAdd} disabled={saving || !newIban.trim()}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("Se salvează...", "Saving...")}</> : t("Salvează", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WithdrawalMethodCard;