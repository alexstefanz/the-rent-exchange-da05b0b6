import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Smartphone, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile } from "@/hooks/queries/useCurrentUserProfile";
import { isValidRomanianPhone } from "@/lib/inputValidation";
import { supabase } from "@/integrations/supabase/client";
import PhoneOtpDialog from "./PhoneOtpDialog";

const EXCLUDED_PREFIXES = [
  "/auth", "/reset", "/termeni", "/politica", "/gdpr", "/anpc", "/cookie",
];

/**
 * Global, non-dismissable gate: every signed-in user (incl. Google/Apple)
 * must have a phone number verified by SMS before using the platform.
 */
const PhoneVerificationRequiredModal = () => {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useCurrentUserProfile();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);

  useEffect(() => {
    setIsAdmin(null);
    if (!user?.id) return;
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => setIsAdmin(!!data));
  }, [user?.id]);

  useEffect(() => {
    if ((profile as any)?.phone && !phone) setPhone((profile as any).phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const excluded = EXCLUDED_PREFIXES.some((p) => location.pathname.startsWith(p));
  const needsVerification =
    !!user && !isLoading && !!profile && isAdmin === false &&
    (profile as any).phone_verified !== true;

  if (!needsVerification || excluded) return null;

  const submit = () => {
    if (!isValidRomanianPhone(phone)) {
      setError("Introdu un număr de telefon românesc valid (ex: 07xx xxx xxx).");
      return;
    }
    setError(null);
    setOtpOpen(true);
  };

  return (
    <>
      <Dialog open={!otpOpen} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md [&>button]:hidden"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Adaugă numărul de telefon
            </DialogTitle>
            <DialogDescription>
              Pentru siguranța comunității Rentli, fiecare cont trebuie să aibă un număr de telefon verificat prin SMS.
              Îl folosim pentru notificări importante despre închirieri.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              type="tel"
              inputMode="tel"
              placeholder="07xx xxx xxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="ghost" onClick={() => signOut()}>Deconectare</Button>
            <Button onClick={submit}>
              {otpOpen ? <Loader2 className="h-4 w-4 animate-spin" /> : "Trimite codul SMS"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <PhoneOtpDialog
        open={otpOpen}
        phone={phone.trim()}
        onOpenChange={(o) => setOtpOpen(o)}
        onVerified={async () => {
          setOtpOpen(false);
          await queryClient.invalidateQueries({ queryKey: ["currentUserProfile", user!.id] });
        }}
      />
    </>
  );
};

export default PhoneVerificationRequiredModal;
