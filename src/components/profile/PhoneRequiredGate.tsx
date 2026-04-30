import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, AlertCircle, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useCurrentUserProfile } from "@/hooks/queries/useCurrentUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { isValidRomanianPhone } from "@/lib/inputValidation";

/**
 * Hook + UI primitives that hard-block actions for users who don't have a
 * valid Romanian phone number in their profile. SMS notifications depend on
 * this number, so we require it before publishing/editing a product, paying
 * for a reservation, or submitting a KYC case.
 */
export const usePhoneRequired = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useCurrentUserProfile();
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasValidPhone = !!user && isValidRomanianPhone((profile as any)?.phone);

  // Returns true when the action can proceed; otherwise opens the dialog and
  // returns false. While the profile is still loading we treat it as missing
  // (defensive) — the caller's button is disabled anyway.
  const requirePhone = useCallback((): boolean => {
    if (!user) return true; // unrelated check — auth handled elsewhere
    if (hasValidPhone) return true;
    setDialogOpen(true);
    return false;
  }, [user, hasValidPhone]);

  return {
    hasValidPhone,
    isProfileLoading: isLoading,
    requirePhone,
    dialogOpen,
    setDialogOpen,
  };
};

interface PhoneRequiredGateProps {
  className?: string;
}

/**
 * Inline red banner shown above forms whose submission is blocked by the
 * missing phone requirement.
 */
export const PhoneRequiredGate = ({ className = "" }: PhoneRequiredGateProps) => {
  const ux = useUxCopy();
  const { user } = useAuth();
  const { data: profile, isLoading } = useCurrentUserProfile();
  const navigate = useNavigate();

  if (!user || isLoading) return null;
  if (isValidRomanianPhone((profile as any)?.phone)) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-destructive/50 bg-destructive/5 p-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="rounded-full bg-destructive/15 p-2 flex-shrink-0">
          <AlertCircle className="h-4 w-4 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-destructive">
            {ux.smsNotifications.requiredTitle}
          </p>
          <p className="text-sm text-foreground/80 mt-0.5">
            {ux.smsNotifications.requiredDesc}
          </p>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => navigate("/contul-meu")}
        className="w-full sm:w-auto sm:flex-shrink-0"
      >
        <Phone className="mr-2 h-4 w-4" />
        {ux.smsNotifications.kycGateCta}
      </Button>
    </div>
  );
};

interface PhoneRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal that appears when the user attempts a blocked action without a phone.
 * Primary CTA navigates to the account page where the phone field lives.
 */
export const PhoneRequiredDialog = ({ open, onOpenChange }: PhoneRequiredDialogProps) => {
  const ux = useUxCopy();
  const navigate = useNavigate();

  const goToAccount = () => {
    onOpenChange(false);
    navigate("/contul-meu");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            {ux.smsNotifications.dialogTitle}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {ux.smsNotifications.dialogDesc}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {ux.smsNotifications.cancel}
          </Button>
          <Button onClick={goToAccount}>
            {ux.smsNotifications.goToAccount}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneRequiredGate;