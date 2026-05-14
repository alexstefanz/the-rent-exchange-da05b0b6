import { Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface BannedBadgeProps {
  className?: string;
  size?: "sm" | "md";
  title?: string;
}

/** Small red "prohibited" badge shown next to user avatar / actions when account is suspended. */
export function BannedBadge({ className, size = "sm", title = "Cont suspendat" }: BannedBadgeProps) {
  const dim = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span
      role="img"
      aria-label={title}
      title={title}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground ring-2 ring-background shadow",
        dim,
        className,
      )}
    >
      <Ban className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} strokeWidth={3} />
    </span>
  );
}