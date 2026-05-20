import {
  Bell,
  MessageCircle,
  Calendar,
  CheckCircle2,
  Wallet,
  LifeBuoy,
  ShieldCheck,
  Eye,
  Star,
  AlertTriangle,
  Send,
  Camera,
  Clock,
  type LucideIcon,
} from "lucide-react";

export type NotificationCategory =
  | "reservation"
  | "message"
  | "payment"
  | "support"
  | "system"
  | "success"
  | "urgent";

export interface CategoryStyle {
  category: NotificationCategory;
  Icon: LucideIcon;
  /** Background tint for the icon halo (semantic-tailwind class). */
  haloClass: string;
  /** Foreground color for the icon. */
  iconClass: string;
  /** Color class for the optional left accent bar. */
  accentClass: string;
  /** Bilingual label. */
  labelRo: string;
  labelEn: string;
}

const STYLES: Record<NotificationCategory, Omit<CategoryStyle, "Icon"> & { Icon: LucideIcon }> = {
  reservation: {
    category: "reservation",
    Icon: Calendar,
    haloClass: "bg-emerald-100",
    iconClass: "text-emerald-600",
    accentClass: "bg-emerald-500",
    labelRo: "Rezervări",
    labelEn: "Bookings",
  },
  message: {
    category: "message",
    Icon: MessageCircle,
    haloClass: "bg-blue-100",
    iconClass: "text-blue-600",
    accentClass: "bg-blue-500",
    labelRo: "Mesaje",
    labelEn: "Messages",
  },
  payment: {
    category: "payment",
    Icon: Wallet,
    haloClass: "bg-violet-100",
    iconClass: "text-violet-600",
    accentClass: "bg-violet-500",
    labelRo: "Plăți",
    labelEn: "Payments",
  },
  support: {
    category: "support",
    Icon: LifeBuoy,
    haloClass: "bg-amber-100",
    iconClass: "text-amber-600",
    accentClass: "bg-amber-500",
    labelRo: "Suport",
    labelEn: "Support",
  },
  system: {
    category: "system",
    Icon: Bell,
    haloClass: "bg-slate-100",
    iconClass: "text-slate-600",
    accentClass: "bg-slate-400",
    labelRo: "Sistem",
    labelEn: "System",
  },
  urgent: {
    category: "urgent",
    Icon: AlertTriangle,
    haloClass: "bg-red-100",
    iconClass: "text-red-600",
    accentClass: "bg-red-500",
    labelRo: "Acțiune necesară",
    labelEn: "Action needed",
  },
  success: {
    category: "success",
    Icon: ShieldCheck,
    haloClass: "bg-emerald-100",
    iconClass: "text-emerald-600",
    accentClass: "bg-emerald-500",
    labelRo: "Verificat",
    labelEn: "Verified",
  },
};

/** Map a backend notification `type` to a presentation category. */
export function categorize(type: string): NotificationCategory {
  const t = (type || "").toLowerCase();
  if (
    t === "kyc_approved" ||
    t === "kyc_verified" ||
    (t.includes("kyc") && (t.includes("approved") || t.includes("verified")))
  ) {
    return "success";
  }
  if (t.includes("message") || t.includes("chat")) return "message";
  if (
    t.includes("rental") ||
    t.includes("reservation") ||
    t.includes("booking") ||
    t.includes("inspection") ||
    t.includes("handover") ||
    t.includes("return")
  ) {
    if (
      t.includes("dispute") ||
      t.includes("cancel") ||
      t.includes("inspection_pending") ||
      t.includes("action")
    )
      return "urgent";
    return "reservation";
  }
  if (t.includes("payment") || t.includes("payout") || t.includes("withdraw") || t.includes("invoice"))
    return "payment";
  if (t.includes("ticket") || t.includes("support")) return "support";
  if (t.includes("kyc") || t.includes("ban") || t.includes("warning") || t.includes("dispute"))
    return "urgent";
  return "system";
}

export function getCategoryStyle(type: string): CategoryStyle {
  return STYLES[categorize(type)];
}

/** Pick a more specific icon when we have one — otherwise fall back to category icon. */
export function getTypeIcon(type: string): LucideIcon {
  const t = (type || "").toLowerCase();
  if (t === "rental_request") return Send;
  if (t === "rental_confirmation" || t === "review") return CheckCircle2;
  if (t === "view") return Eye;
  if (t === "review_received") return Star;
  if (t === "kyc_approved") return ShieldCheck;
  if (t === "cancel_request_submitted") return Clock;
  if (t.includes("inspection") || t.includes("handover")) return Camera;
  return getCategoryStyle(type).Icon;
}

export const ALL_CATEGORIES: NotificationCategory[] = [
  "reservation",
  "payment",
  "support",
  "system",
];

export function getCategoryLabel(c: NotificationCategory, language: string): string {
  return language === "ro" ? STYLES[c].labelRo : STYLES[c].labelEn;
}