import { Smartphone, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceBadgeProps {
  source?: string | null;
  className?: string;
}

/** Etichetă care arată de unde a fost creată înregistrarea: aplicația mobilă sau web. */
const SourceBadge = ({ source, className }: SourceBadgeProps) => {
  const isMobile = source === "mobile";
  const Icon = isMobile ? Smartphone : Monitor;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap",
        isMobile
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground",
        className
      )}
      title={isMobile ? "Creat din aplicația mobilă" : "Creat de pe web"}
    >
      <Icon className="h-3 w-3" />
      {isMobile ? "Mobil" : "Web"}
    </span>
  );
};

export default SourceBadge;
