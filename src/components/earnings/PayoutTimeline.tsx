import { Check, Loader2, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Step = "requested" | "processing" | "sent" | "completed";

const order: Step[] = ["requested", "processing", "sent", "completed"];

export const PayoutTimeline = ({ status }: { status: string }) => {
  const { t } = useLanguage();
  const labels: Record<Step, string> = {
    requested: t("Cerută", "Requested"),
    processing: t("Procesare", "Processing"),
    sent: t("Trimis către bancă", "Sent to bank"),
    completed: t("Finalizat", "Completed"),
  };

  const failed = status === "rejected" || status === "failed";
  let currentIdx = 0;
  if (status === "approved") currentIdx = 2;
  else if (status === "completed") currentIdx = 3;
  else if (status === "pending") currentIdx = 0;

  return (
    <div className="flex items-center justify-between gap-1 sm:gap-2">
      {order.map((step, i) => {
        const done = !failed && i <= currentIdx;
        const active = !failed && i === currentIdx && status !== "completed";
        return (
          <div key={step} className="flex-1 flex items-center gap-1 sm:gap-2 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center transition ${
                  failed && i === 0
                    ? "bg-destructive text-destructive-foreground"
                    : done
                    ? "bg-emerald-600 text-white"
                    : active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {failed && i === 0 ? (
                  <X className="h-3.5 w-3.5" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-[10px] font-semibold">{i + 1}</span>
                )}
              </div>
              <span className="text-[10px] text-center text-muted-foreground hidden sm:block max-w-[80px] leading-tight">
                {labels[step]}
              </span>
            </div>
            {i < order.length - 1 && (
              <div className={`h-0.5 flex-1 rounded ${done && i < currentIdx ? "bg-emerald-600" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PayoutTimeline;