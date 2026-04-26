import { Link } from "react-router-dom";
import { Phone, ArrowRight } from "lucide-react";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useCurrentUserProfile } from "@/hooks/queries/useCurrentUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { isValidRomanianPhone } from "@/lib/inputValidation";

/**
 * Non-blocking banner that prompts the logged-in user to add a valid RO phone
 * number so they can receive transactional SMS (rental requests, approvals,
 * cancellations, return reminders).
 *
 * Renders nothing if:
 *  - user is not logged in
 *  - profile is still loading
 *  - user already has a valid RO phone number
 */
const SmsPhonePromptBanner = ({ className = "" }: { className?: string }) => {
  const { user } = useAuth();
  const ux = useUxCopy();
  const { data: profile, isLoading } = useCurrentUserProfile();

  if (!user || isLoading) return null;
  if (isValidRomanianPhone((profile as any)?.phone)) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/20 p-4 ${className}`}
      role="status"
    >
      <div className="rounded-full bg-amber-500/15 p-2 flex-shrink-0">
        <Phone className="h-4 w-4 text-amber-700 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          {ux.smsNotifications.promptTitle}
        </p>
        <p className="text-sm text-amber-800/90 dark:text-amber-200/80 mt-0.5">
          {ux.smsNotifications.promptDesc}
        </p>
      </div>
      <Link
        to="/contul-meu"
        className="flex items-center gap-1 text-sm font-medium text-amber-900 dark:text-amber-200 hover:underline whitespace-nowrap self-center"
      >
        {ux.smsNotifications.promptCta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
};

export default SmsPhonePromptBanner;