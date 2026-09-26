import { toast } from "sonner";
import {
  X,
  CheckCircle2,
  XCircle,
  Wallet,
  LifeBuoy,
  Bell,
  MessageCircle,
  Send,
  Info,
  AlertTriangle,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { categorize } from "@/lib/notificationCategory";
import { toFriendlyError } from "@/lib/errorHandler";

export type NotifyVariant =
  | "confirmation"
  | "cancellation"
  | "payment"
  | "support"
  | "system"
  | "message"
  | "request"
  | "info"
  | "warning";

interface VariantStyle {
  Icon: LucideIcon;
  halo: string;
  icon: string;
  accent: string;
  badgeBg: string;
}

const VARIANT_STYLES: Record<NotifyVariant, VariantStyle> = {
  confirmation: {
    Icon: CheckCircle2,
    halo: "bg-emerald-500/15",
    icon: "text-emerald-600",
    accent: "bg-emerald-500",
    badgeBg: "bg-emerald-500",
  },
  payment: {
    Icon: Wallet,
    halo: "bg-emerald-500/15",
    icon: "text-emerald-600",
    accent: "bg-emerald-500",
    badgeBg: "bg-emerald-500",
  },
  cancellation: {
    Icon: XCircle,
    halo: "bg-red-500/15",
    icon: "text-red-600",
    accent: "bg-red-500",
    badgeBg: "bg-red-500",
  },
  warning: {
    Icon: AlertTriangle,
    halo: "bg-red-500/15",
    icon: "text-red-600",
    accent: "bg-red-500",
    badgeBg: "bg-red-500",
  },
  support: {
    Icon: LifeBuoy,
    halo: "bg-blue-500/15",
    icon: "text-blue-600",
    accent: "bg-blue-500",
    badgeBg: "bg-blue-500",
  },
  system: {
    Icon: Bell,
    halo: "bg-blue-500/15",
    icon: "text-blue-600",
    accent: "bg-blue-500",
    badgeBg: "bg-blue-500",
  },
  info: {
    Icon: Info,
    halo: "bg-blue-500/15",
    icon: "text-blue-600",
    accent: "bg-blue-500",
    badgeBg: "bg-blue-500",
  },
  message: {
    Icon: MessageCircle,
    halo: "bg-blue-500/15",
    icon: "text-blue-600",
    accent: "bg-blue-500",
    badgeBg: "bg-blue-500",
  },
  request: {
    Icon: Send,
    halo: "bg-primary/15",
    icon: "text-primary",
    accent: "bg-primary",
    badgeBg: "bg-primary",
  },
};

interface NotifyOptions {
  title: string;
  message: string;
  image?: string | null;
  duration?: number;
  link?: string | null;
}

const GLOBAL_NOTIFICATION_TOAST_ID = "rentli:notification-toast";

function NotificationToast({
  id,
  variant,
  title,
  message,
  image,
  link,
}: NotifyOptions & { id: string | number; variant: NotifyVariant }) {
  const s = VARIANT_STYLES[variant];
  const { Icon } = s;
  const handleClick = () => {
    if (!link) return;
    toast.dismiss(id);
    if (typeof window !== "undefined") {
      if (link.startsWith("http")) window.location.assign(link);
      else window.history.pushState({}, "", link);
      // Notify the SPA router (React Router listens to popstate).
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };
  return (
    <div
      onClick={link ? handleClick : undefined}
      role={link ? "button" : undefined}
      tabIndex={link ? 0 : undefined}
      className={cn(
        "relative flex items-start gap-3 w-[min(380px,calc(100vw-32px))]",
        "bg-background border border-border/60 rounded-2xl overflow-hidden",
        "shadow-[0_12px_40px_-12px_hsl(var(--foreground)/0.18)]",
        "px-4 py-3.5 pr-9",
        link && "cursor-pointer",
      )}
    >
      <span className={cn("absolute left-0 top-0 bottom-0 w-1", s.accent)} />
      {image ? (
        <div className="relative shrink-0 h-12 w-12 rounded-xl overflow-hidden bg-muted">
          <img src={image} alt={title} className="h-full w-full object-cover" />
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full inline-flex items-center justify-center ring-2 ring-background",
              s.badgeBg,
            )}
          >
            <Icon className="h-3 w-3 text-white" />
          </span>
        </div>
      ) : (
        <div
          className={cn(
            "shrink-0 h-12 w-12 rounded-xl inline-flex items-center justify-center",
            s.halo,
          )}
        >
          <Icon className={cn("h-6 w-6", s.icon)} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground line-clamp-1">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{message}</p>
      </div>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          toast.dismiss(id);
        }}
        aria-label="Close"
        className="absolute top-1.5 right-1.5 z-10 h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function show(variant: NotifyVariant, opts: NotifyOptions) {
  const duration =
    opts.duration ??
    (variant === "cancellation" || variant === "warning" ? 10000 : 6000);
  // Do NOT call toast.dismiss() here: it would trigger the previous toast's
  // exit animation while the new one fades in, briefly showing two overlapping
  // cards ("double background"). Reusing the same id causes sonner to replace
  // the existing toast atomically instead.
  return toast.custom(
    (id) => (
      <NotificationToast
        id={id}
        variant={variant}
        title={opts.title}
        message={opts.message}
        image={opts.image}
        link={opts.link}
      />
    ),
    {
      id: GLOBAL_NOTIFICATION_TOAST_ID,
      duration,
      position: "bottom-center",
      unstyled: true,
      classNames: {
        toast:
          "!bg-transparent !border-0 !shadow-none !p-0 !rounded-none !w-auto",
      },
    },
  );
}

export const notify = {
  confirmation: (o: NotifyOptions) => show("confirmation", o),
  cancellation: (o: NotifyOptions) => show("cancellation", o),
  payment: (o: NotifyOptions) => show("payment", o),
  support: (o: NotifyOptions) => show("support", o),
  system: (o: NotifyOptions) => show("system", o),
  message: (o: NotifyOptions) => show("message", o),
  request: (o: NotifyOptions) => show("request", o),
  warning: (o: NotifyOptions) => show("warning", o),
  info: (o: NotifyOptions) => show("info", o),
  // Back-compat: previous rental toast
  rental: (o: NotifyOptions) => show("request", o),
  // Shortcuts for plain string toasts using the new card
  success: (message: string, title = "Succes") =>
    show("confirmation", { title, message }),
  error: (message: string, title = "Eroare") =>
    show("cancellation", { title, message }),
};

/**
 * Display a backend / RPC error as a styled card, translating known
 * technical messages into friendly Romanian copy and silently swallowing
 * harmless duplicate-state errors. Always logs the raw error for devs.
 */
export function notifyError(
  error: unknown,
  opts: { fallbackTitle?: string } = {},
) {
  const friendly = toFriendlyError(error, opts.fallbackTitle ?? "Ceva nu a mers");
  if (typeof console !== "undefined") console.warn("[notifyError]", error);
  if (friendly.suppress) return;
  show("cancellation", { title: friendly.title, message: friendly.message });
}

/** Map a DB notification row to a toast variant. */
export function variantFromNotificationType(type: string): NotifyVariant {
  const t = (type || "").toLowerCase();
  // Explicit mappings for rental lifecycle / timeline events.
  const explicit: Record<string, NotifyVariant> = {
    active_rental_started: "confirmation",
    handover_confirmed: "confirmation",
    rental_completed: "confirmation",
    review_reminder: "confirmation",
    request_accepted: "confirmation",
    payment_succeeded: "payment",
    pickup_scheduled: "system",
    return_reminder_24h: "system",
    return_in_progress: "system",
    pv_pickup_pending: "system",
    pv_return_pending: "system",
    pv_pickup_completed_by_party: "system",
    pv_return_completed_by_party: "system",
    dispute_opened: "cancellation",
  };
  if (explicit[t]) return explicit[t];
  if (
    t.includes("cancel") ||
    t.includes("reject") ||
    t.includes("declin") ||
    t.includes("dispute") ||
    t.includes("ban") ||
    t.includes("warning")
  ) {
    return "cancellation";
  }
  if (
    t.includes("confirm") ||
    t.includes("approved") ||
    t.includes("accepted") ||
    t === "rental_confirmation"
  ) {
    return "confirmation";
  }
  if (
    t.includes("payment") ||
    t.includes("payout") ||
    t.includes("withdraw") ||
    t.includes("invoice") ||
    t.includes("refund")
  ) {
    return "payment";
  }
  if (t.includes("ticket") || t.includes("support")) return "support";
  if (t.includes("message") || t.includes("chat")) return "message";
  if (t === "rental_request" || t.includes("request")) return "request";
  // Fallback by category
  const c = categorize(type);
  if (c === "urgent") return "cancellation";
  if (c === "payment") return "payment";
  if (c === "support") return "support";
  if (c === "reservation") return "confirmation";
  if (c === "message") return "message";
  return "system";
}

interface DbNotification {
  type: string;
  title_ro: string;
  title_en?: string | null;
  description_ro?: string | null;
  description_en?: string | null;
  link?: string | null;
}

/** Show a toast for a DB notification row, picking language from localStorage. */
export function notifyFromDb(n: DbNotification, image?: string | null) {
  const lang = (typeof window !== "undefined" && localStorage.getItem("app_language")) || "ro";
  const rawTitle = lang === "en" ? (n.title_en || n.title_ro) : n.title_ro;
  const title = rawTitle || n.title_ro || (n.type ? n.type.replace(/_/g, " ") : "Notificare");
  const message =
    (lang === "en" ? (n.description_en || n.description_ro) : n.description_ro) || "";
  const variant = variantFromNotificationType(n.type);
  console.log("[notify] showing toast", { type: n.type, variant, title });
  show(variant, { title, message, image, link: n.link ?? null });
}
