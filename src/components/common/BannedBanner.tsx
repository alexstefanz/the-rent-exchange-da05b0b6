import { Ban } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsBanned } from "@/hooks/useIsBanned";

interface BannedBannerProps {
  /** Optional override for the contextual message line. */
  context?: string;
  className?: string;
}

/**
 * Persistent red banner that appears on key pages when the current user is banned.
 * Renders nothing for non-banned users.
 */
export function BannedBanner({ context, className }: BannedBannerProps) {
  const { isBanned, banReason } = useIsBanned();
  if (!isBanned) return null;
  return (
    <div
      role="alert"
      className={
        "rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3 " +
        (className ?? "")
      }
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
        <Ban className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <div className="flex-1 min-w-0 text-sm">
        <p className="font-semibold text-destructive">Cont suspendat</p>
        <p className="text-foreground/80 mt-0.5">
          {context ??
            "Contul tău este suspendat. Nu poți publica anunțuri, face rezervări noi sau trimite mesaje."}
        </p>
        {banReason && (
          <p className="text-foreground/70 mt-1">
            <span className="font-medium">Motiv: </span>
            {banReason}
          </p>
        )}
        <Link
          to="/suport"
          className="mt-2 inline-block text-sm font-medium text-destructive underline-offset-2 hover:underline"
        >
          Contestă această decizie
        </Link>
      </div>
    </div>
  );
}