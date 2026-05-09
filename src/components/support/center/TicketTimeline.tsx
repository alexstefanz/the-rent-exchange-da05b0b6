import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { OpsTicket } from "@/features/tickets/userTicketsApi";

const STEPS = [
  { key: "NEW",         ro: "Trimis",       en: "Submitted" },
  { key: "IN_PROGRESS", ro: "În analiză",   en: "Under review" },
  { key: "WAITING",     ro: "În lucru",     en: "Working on it" },
  { key: "RESOLVED",    ro: "Rezolvat",     en: "Resolved" },
] as const;

function statusIndex(status: string): number {
  if (status === "RESOLVED" || status === "CLOSED") return 3;
  if (status === "WAITING_CUSTOMER" || status === "WAITING_OWNER" || status === "WAITING_INTERNAL") return 2;
  if (status === "IN_PROGRESS") return 1;
  return 0;
}

export function TicketTimeline({ ticket }: { ticket: OpsTicket }) {
  const { t } = useLanguage();
  const idx = statusIndex(ticket.status);

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4">
      <div className="flex items-center gap-2 mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <Clock className="h-3.5 w-3.5" />
        {t("Etape ticket", "Ticket stages")}
      </div>
      <div className="flex items-center justify-between gap-1">
        {STEPS.map((step, i) => {
          const done = i <= idx;
          const current = i === idx && ticket.status !== "CLOSED";
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="flex items-center w-full">
                <div className={cn("h-[2px] flex-1", i === 0 ? "opacity-0" : done ? "bg-primary" : "bg-border")} />
                <div
                  className={cn(
                    "h-7 w-7 rounded-full grid place-items-center transition-all",
                    done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    current && "ring-4 ring-primary/15"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px] font-semibold">{i + 1}</span>}
                </div>
                <div className={cn("h-[2px] flex-1", i === STEPS.length - 1 ? "opacity-0" : i < idx ? "bg-primary" : "bg-border")} />
              </div>
              <span className={cn("text-[10px] text-center", done ? "text-foreground font-medium" : "text-muted-foreground")}>
                {t(step.ro, step.en)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}