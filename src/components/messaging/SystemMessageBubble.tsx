import { motion } from "framer-motion";
import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import {
  BellRing,
  CheckCircle2,
  XCircle,
  CreditCard,
  Package,
  RotateCcw,
  ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Message } from "@/features/messaging/messagingApi";

interface Props {
  message: Message;
}

type TimelineKind =
  | "booking_confirmed"
  | "request_accepted"
  | "request_declined"
  | "payment_completed"
  | "handover_done"
  | "return_started"
  | "rental_completed"
  | "booking_cancelled";

interface ParsedTimeline {
  kind: TimelineKind;
  /** Optional rental public id (legacy "booking_confirmed" payload omits it). */
  publicId?: string;
  productTitle: string;
  startDate: string;
  endDate: string;
  duration: string;
  total: string;
}

type ParsedSystem = ParsedTimeline | { kind: "raw"; text: string };

const TIMELINE_KINDS: TimelineKind[] = [
  "booking_confirmed",
  "request_accepted",
  "request_declined",
  "payment_completed",
  "handover_done",
  "return_started",
  "rental_completed",
  "booking_cancelled",
];

function parseContent(content: string): ParsedSystem {
  const parts = content.split("|");
  const head = parts[0] as TimelineKind;
  if (!TIMELINE_KINDS.includes(head)) {
    return { kind: "raw", text: content };
  }
  // Newer payloads include the rental public_id as the 2nd field.
  // Legacy "booking_confirmed|<title>|<start>|<end>|<duration>|<total>" omits it.
  const hasPublicId =
    parts.length >= 7 && /^RNT-/i.test(parts[1] ?? "");
  const offset = hasPublicId ? 1 : 0;
  if (parts.length < 6 + offset) return { kind: "raw", text: content };
  return {
    kind: head,
    publicId: hasPublicId ? parts[1] : undefined,
    productTitle: parts[1 + offset],
    startDate: parts[2 + offset],
    endDate: parts[3 + offset],
    duration: parts[4 + offset],
    total: parts[5 + offset],
  };
}

export function SystemMessageBubble({ message }: Props) {
  const { language, t } = useLanguage();
  const locale = language === "ro" ? ro : enUS;
  const parsed = parseContent(message.content);

  const variant = parsed.kind === "raw" ? null : getVariant(parsed.kind, t);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="flex w-full justify-center my-1"
    >
      <div className="max-w-[88%] sm:max-w-[78%] flex flex-col items-center">
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] w-full",
            variant?.tone === "neutral-dark"
              ? "border-foreground/15 bg-foreground/5"
              : "border-primary/20 bg-primary/5",
          )}
        >
          {parsed.kind !== "raw" && variant ? (
            <>
              <div
                className={cn(
                  "flex items-center justify-center gap-1.5 font-semibold text-[13px] mb-1",
                  variant.tone === "neutral-dark" ? "text-foreground" : "text-primary",
                )}
              >
                <variant.Icon className="h-4 w-4" />
                {variant.title}
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
                {variant.footer ? (
                  <div className="text-[11px] text-muted-foreground mt-1.5 italic">
                    {variant.footer}
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground">
              <BellRing className="h-3.5 w-3.5" />
              {(parsed as { text: string }).text}
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

type Tone = "primary" | "neutral-dark";

interface Variant {
  Icon: typeof CheckCircle2;
  title: string;
  footer: string | null;
  tone: Tone;
}

function getVariant(
  kind: TimelineKind,
  t: (ro: string, en: string) => string,
): Variant {
  switch (kind) {
    case "booking_confirmed":
      return {
        Icon: CheckCircle2,
        title: t("Rezervare confirmată", "Booking confirmed"),
        footer: t("Așteaptă confirmarea proprietarului", "Waiting for owner confirmation"),
        tone: "primary",
      };
    case "request_accepted":
      return {
        Icon: ThumbsUp,
        title: t("Cerere acceptată", "Request accepted"),
        footer: t("Așteaptă plata chiriașului", "Waiting for renter payment"),
        tone: "primary",
      };
    case "request_declined":
      return {
        Icon: XCircle,
        title: t("Cerere refuzată", "Request declined"),
        footer: t("Rezervarea nu a fost confirmată", "Booking was not confirmed"),
        tone: "neutral-dark",
      };
    case "payment_completed":
      return {
        Icon: CreditCard,
        title: t("Plată efectuată", "Payment completed"),
        footer: t("Așteaptă predarea produsului", "Waiting for item handover"),
        tone: "primary",
      };
    case "handover_done":
      return {
        Icon: Package,
        title: t("Produs predat", "Item handed over"),
        footer: t("Închirierea este activă", "Rental is active"),
        tone: "primary",
      };
    case "return_started":
      return {
        Icon: RotateCcw,
        title: t("Returnare în curs", "Return in progress"),
        footer: t("Așteaptă confirmarea proprietarului", "Waiting for owner confirmation"),
        tone: "primary",
      };
    case "rental_completed":
      return {
        Icon: CheckCircle2,
        title: t("Închiriere finalizată", "Rental completed"),
        footer: t("Lasă o recenzie", "Leave a review"),
        tone: "primary",
      };
    case "booking_cancelled":
      return {
        Icon: XCircle,
        title: t("Rezervare anulată", "Booking cancelled"),
        footer: null,
        tone: "neutral-dark",
      };
  }
}
