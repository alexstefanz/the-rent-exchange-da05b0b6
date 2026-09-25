import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useUxCopy } from "@/hooks/useUxCopy";

interface PhoneOtpDialogProps {
  open: boolean;
  phone: string;
  onOpenChange: (open: boolean) => void;
  onVerified: (phone: string) => void;
  /**
   * Optional credentials used as a fallback to re-establish a fully
   * authenticated session if `refreshSession()` fails after the phone OTP
   * is verified (e.g. right after sign-up when the email was not yet
   * confirmed). Pass undefined when not applicable (e.g. account settings).
   */
  fallbackCreds?: { email: string; password: string } | null;
}

const PhoneOtpDialog = ({ open, phone, onOpenChange, onVerified, fallbackCreds }: PhoneOtpDialogProps) => {
  const ux = useUxCopy();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  // Send code automatically the first time the dialog opens for this phone.
  useEffect(() => {
    if (!open) return;
    setCode("");
    setCooldown(60);
    sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phone]);

  useEffect(() => {
    if (!open || cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [open, cooldown]);

  const sendCode = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-phone-otp", { body: { phone } });
      if (error || (data as any)?.error) {
        const err = (data as any)?.error || error?.message;
        const providerMsg = (data as any)?.providerMessage;
        if (err === "rate_limited" || err === "too_many_requests") {
          toast.error(ux.phoneOtp.rateLimited);
        } else if (err === "sms_failed" && providerMsg) {
          toast.error(`${ux.phoneOtp.sendError}: ${providerMsg}`);
        } else {
          toast.error(ux.phoneOtp.sendError);
        }
        return;
      }
      toast.success(ux.phoneOtp.sent);
      setCooldown(60);
    } catch {
      toast.error(ux.phoneOtp.sendError);
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    if (code.length !== 6) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-phone-otp", { body: { phone, code } });
      const errKey = (data as any)?.error || (error ? "invalid_code" : null);
      if (errKey) {
        if (errKey === "expired") toast.error(ux.phoneOtp.expired);
        else if (errKey === "too_many_attempts") toast.error(ux.phoneOtp.tooMany);
        else toast.error(ux.phoneOtp.invalidCode);
        setCode("");
        return;
      }
      toast.success(ux.phoneOtp.success);
      // If we have signup credentials, always sign the user in fresh — the
      // edge function has just confirmed their email, so signInWithPassword
      // is guaranteed to succeed and yields a fully authenticated session
      // without requiring the user to visit the login screen.
      if (fallbackCreds?.email && fallbackCreds.password) {
        try {
          await supabase.auth.signInWithPassword({
            email: fallbackCreds.email,
            password: fallbackCreds.password,
          });
        } catch {
          // Last-resort fallback: try to refresh whatever session exists.
          try { await supabase.auth.refreshSession(); } catch { /* ignore */ }
        }
      } else {
        // No signup creds (e.g. verifying phone from account settings):
        // just refresh the existing session to pick up new claims.
        try { await supabase.auth.refreshSession(); } catch { /* ignore */ }
      }
      onVerified(phone);
      // Do NOT call onOpenChange(false) here — the caller's onVerified
      // handler already closes the dialog. Calling both would fire the
      // parent's onOpenChange guard with a stale `gatingLogin` closure
      // and accidentally sign the freshly-authenticated user out.
    } catch {
      toast.error(ux.phoneOtp.invalidCode);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            {ux.phoneOtp.dialogTitle}
          </DialogTitle>
          <DialogDescription>{ux.phoneOtp.dialogDesc(phone)}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <InputOTP maxLength={6} value={code} onChange={setCode} inputMode="numeric" pattern="[0-9]*">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <Button
            variant="link"
            size="sm"
            type="button"
            disabled={cooldown > 0 || sending}
            onClick={sendCode}
          >
            {sending ? ux.phoneOtp.sending : cooldown > 0 ? ux.phoneOtp.resendIn(cooldown) : ux.phoneOtp.resend}
          </Button>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={verifying}>
            {ux.phoneOtp.cancel}
          </Button>
          <Button onClick={verify} disabled={code.length !== 6 || verifying}>
            {verifying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{ux.phoneOtp.verifying}</> : ux.phoneOtp.verify}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneOtpDialog;