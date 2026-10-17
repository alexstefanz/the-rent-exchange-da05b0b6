import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile } from "@/hooks/queries/useCurrentUserProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRound, Loader2 } from "lucide-react";

/**
 * Global gate: users who signed up with Google/Apple (or who have no name at
 * all) must confirm their full name once. The dialog reappears on each visit
 * until the name is confirmed; "Mai târziu" dismisses it for the session.
 * After confirmation the name is locked (only admins can change it).
 */
const FullNameConfirmDialog = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading } = useCurrentUserProfile();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const p = profile as any;
  const needsConfirmation =
    !!user &&
    !!p &&
    (p.full_name_verified_at == null ||
      !p.full_name ||
      btrimEmpty(p.full_name));

  useEffect(() => {
    if (authLoading || isLoading || dismissed) return;
    if (needsConfirmation) {
      setName(
        p.full_name ||
          (user?.user_metadata as any)?.full_name ||
          (user?.user_metadata as any)?.name ||
          ""
      );
      setOpen(true);
    } else {
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsConfirmation, authLoading, isLoading, dismissed]);

  const confirm = async () => {
    if (!user) return;
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (trimmed.length < 2 || !trimmed.includes(" ")) {
      setError(
        t(
          "Introdu numele tău complet (prenume și nume).",
          "Please enter your full name (first and last name)."
        )
      );
      return;
    }
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase.rpc("confirm_my_full_name" as any, {
      _full_name: trimmed,
    });
    setSaving(false);
    if (updateError) {
      setError(
        t(
          "Nu s-a putut salva numele. Încearcă din nou.",
          "Could not save your name. Please try again."
        )
      );
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["currentUserProfile", user.id] });
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setDismissed(true);
          setOpen(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 rounded-full bg-primary/10 p-3">
            <UserRound className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            {t("Confirmă-ți numele complet", "Confirm your full name")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t(
              "Numele tău real apare în contractele de închiriere și le arată celorlalți utilizatori cu cine interacționează. După confirmare, numele nu mai poate fi modificat decât de echipa Rentli.",
              "Your real name appears on rental agreements and shows other users who they are dealing with. Once confirmed, it can only be changed by the Rentli team."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirm-full-name">
            {t("Nume complet", "Full name")}
          </Label>
          <Input
            id="confirm-full-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder={t("ex. Alexandru Stefan", "e.g. John Smith")}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setDismissed(true);
              setOpen(false);
            }}
            disabled={saving}
          >
            {t("Mai târziu", "Later")}
          </Button>
          <Button type="button" onClick={confirm} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("Confirmă numele", "Confirm name")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const btrimEmpty = (s: string) => s.trim().length === 0;

export default FullNameConfirmDialog;
