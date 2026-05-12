import { motion } from "framer-motion";
import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { BellRing, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Message } from "@/features/messaging/messagingApi";

interface Props {
  message: Message;
}

interface ParsedBookingConfirmed {
  kind: "booking_confirmed";
  productTitle: string;
  startDate: string;
  endDate: string;
  duration: string;
  total: string;
}

type ParsedSystem = ParsedBookingConfirmed | { kind: "raw"; text: string };

function parseContent(content: string): ParsedSystem {
  const parts = content.split("|");
  if (parts[0] === "booking_confirmed" && parts.length >= 6) {
    return {
      kind: "booking_confirmed",
      productTitle: parts[1],
      startDate: parts[2],
      endDate: parts[3],
      duration: parts[4],
      total: parts[5],
    };
  }
  return { kind: "raw", text: content };
}

export function SystemMessageBubble({ message }: Props) {
  const { language, t } = useLanguage();
  const locale = language === "ro" ? ro : enUS;
  const parsed = parseContent(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="flex w-full justify-center my-1"
    >
      <div className="max-w-[88%] sm:max-w-[78%] flex flex-col items-center">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] w-full">
          {parsed.kind === "booking_confirmed" ? (
            <>
              <div className="flex items-center justify-center gap-1.5 text-primary font-semibold text-[13px] mb-1">
                <CheckCircle2 className="h-4 w-4" />
                {t("Rezervare confirmată", "Booking confirmed")}
              </div>
              <div className="text-center text-[13px] text-foreground leading-relaxed">
                <div className="font-medium">„{parsed.productTitle}"</div>
                <div className="text-muted-foreground text-xs mt-0.5">
                  {parsed.startDate} – {parsed.endDate} • {parsed.duration}
                </div>
                <div className="text-xs mt-1">
                  {t("Total", "Total")}:{" "}
                  <span className="font-semibold text-foreground">{parsed.total}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1.5 italic">
                  {t("Așteaptă confirmarea proprietarului", "Waiting for owner confirmation")}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground">
              <BellRing className="h-3.5 w-3.5" />
              {parsed.text}
            </div>
          )}
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">
          {format(new Date(message.created_at), "HH:mm", { locale })}
        </div>
      </div>
    </motion.div>
  );
}
