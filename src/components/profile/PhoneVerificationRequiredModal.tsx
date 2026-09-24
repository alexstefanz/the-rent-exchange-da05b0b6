import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Smartphone } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile } from "@/hooks/queries/useCurrentUserProfile";
import { isValidRomanianPhone } from "@/lib/inputValidation";
import { supabase } from "@/integrations/supabase/client";
import PhoneOtpDialog from "./PhoneOtpDialog";

/** Phone entry + SMS code verification. Can be dismissed ("Mai târziu"). */
export const PhoneVerifyDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const { user } = useAuth();
  const { data: profile } = useCurrentUserProfile();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);

  useEffect(() => {
    if (open && (profile as any)?.phone && !phone) setPhone((profile as any).phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profile]);

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
      <Dialog open={open && !otpOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Verifică numărul de telefon
            </DialogTitle>
            <DialogDescription>
              Pentru a publica anunțuri sau a închiria, ai nevoie de un număr de telefon verificat prin SMS.
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
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Mai târziu</Button>
            <Button onClick={submit}>Trimite codul SMS</Button>
          </div>
        </DialogContent>
      </Dialog>
      <PhoneOtpDialog
        open={otpOpen}
        phone={phone.trim()}
        onOpenChange={setOtpOpen}
        onVerified={async () => {
          setOtpOpen(false);
          onOpenChange(false);
          if (user) await queryClient.invalidateQueries({ queryKey: ["currentUserProfile", user.id] });
        }}
      />
    </>
  );
};

const EXCLUDED_PREFIXES = ["/auth", "/reset"];

/** Slim, non-blocking notice shown to signed-in users without a verified phone. */
const PhoneVerificationNotice = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useCurrentUserProfile();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setIsAdmin(null);
    if (!user?.id) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user?.id]);

  const show =
    !!user && !isLoading && !!profile && isAdmin === false &&
    (profile as any).phone_verified !== true &&
    !EXCLUDED_PREFIXES.some((p) => location.pathname.startsWith(p));

  if (!show) return null;

  return (
    <>
      <div className="fixed bottom-20 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 md:bottom-4">
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-card px-4 py-3 shadow-lg">
          <Smartphone className="h-5 w-5 shrink-0 text-primary" />
          <p className="flex-1 text-sm text-foreground">
            Verifică-ți numărul de telefon ca să poți publica anunțuri și închiria.
          </p>
          <Button size="sm" onClick={() => setOpen(true)}>Verifică</Button>
        </div>
      </div>
      <PhoneVerifyDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

export default PhoneVerificationNotice;
