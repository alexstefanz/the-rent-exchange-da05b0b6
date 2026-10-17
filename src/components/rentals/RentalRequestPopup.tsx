import { useEffect, useState } from "react";
import { X, MessageCircle, CalendarDays, Sparkles, XCircle, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistanceToNow, format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import type { RentalPopupItem } from "@/features/rentals/popupApi";
import { getUserStatistics, type UserStatistics } from "@/features/profile/statisticsApi";

export type PopupMode = "owner" | "renter";

interface Props {
  item: RentalPopupItem;
  mode: PopupMode;
  stackCount?: number;
  onAccept?: () => Promise<void> | void;
  onReject?: () => Promise<void> | void;
  onViewProduct?: () => Promise<void> | void;
  onViewSimilar?: () => Promise<void> | void;
  onDismiss: () => void;
}

const initials = (name: string | null | undefined) =>
  (name || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function RentalRequestPopup({ item, mode, stackCount, onAccept, onReject, onViewProduct, onViewSimilar, onDismiss }: Props) {
  const { language } = useLanguage();
  const locale = language === "ro" ? ro : enUS;
  const [busy, setBusy] = useState<null | "accept" | "reject" | "product" | "similar">(null);
  const [stats, setStats] = useState<UserStatistics | null>(null);

  useEffect(() => {
    let alive = true;
    setStats(null);
    if (item.counterparty_id) {
      getUserStatistics(item.counterparty_id).then((s) => { if (alive) setStats(s); });
    }
    return () => { alive = false; };
  }, [item.counterparty_id]);

  const t = (ro: string, en: string) => (language === "ro" ? ro : en);

  const isCancelledByOwner = mode === "renter" && item.outcome === "cancelled_by_owner";
  const isRejected = mode === "renter" && (item.outcome === "rejected" || isCancelledByOwner);
  const badgeLabel = mode === "owner"
    ? t("CERERE NOUĂ", "NEW REQUEST")
    : isCancelledByOwner
      ? t("REZERVAREA A FOST ANULATĂ DE PROPRIETAR", "BOOKING CANCELLED BY OWNER")
      : isRejected
        ? t("CERERE REFUZATĂ", "REQUEST DECLINED")
        : t("CERERE APROBATĂ", "REQUEST APPROVED");

  const since = (() => {
    const stamp = mode === "owner" ? item.created_at : (item.confirmed_at || item.created_at);
    if (!stamp) return "";
    try {
      return formatDistanceToNow(new Date(stamp), { addSuffix: false, locale });
    } catch { return ""; }
  })();

  const periodLabel = (() => {
    try {
      const s = format(new Date(item.start_date), "d MMM", { locale });
      const e = format(new Date(item.end_date), "d MMM", { locale });
      return `${s} — ${e} · ${item.rental_days} ${t("zile", "days")}`;
    } catch { return ""; }
  })();

  const totalLabel = `${Math.round(item.subtotal).toLocaleString("ro-RO")} RON ${t("total", "total")}`;

  const handle = async (kind: "accept" | "reject" | "product" | "similar", fn?: () => Promise<void> | void) => {
    if (!fn) return;
    setBusy(kind);
    try { await fn(); } finally { setBusy(null); }
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      className="pointer-events-auto w-[min(420px,calc(100vw-2rem))] rounded-2xl border bg-card shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-300"
    >
      <div className="relative p-4 sm:p-5">
        <button
          type="button"
          aria-label={t("Închide", "Close")}
          onClick={onDismiss}
          className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        {stackCount && stackCount > 1 ? (
          <span className="absolute right-12 top-3.5 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            +{stackCount - 1}
          </span>
        ) : null}

        <div
          className={
            isRejected
              ? "inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-destructive"
              : "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary"
          }
        >
          {isRejected ? <XCircle className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
          {badgeLabel}
        </div>

        {/* Counterparty */}
        <div className="mt-3 flex items-start gap-3">
          <a
            href={item.counterparty_id ? `/utilizator/${item.counterparty_id}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("Vezi profilul", "View profile")}
          >
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={item.counterparty_avatar || undefined} alt={item.counterparty_name || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {initials(item.counterparty_name)}
              </AvatarFallback>
            </Avatar>
          </a>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              {item.counterparty_id ? (
                <a
                  href={`/utilizator/${item.counterparty_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm font-semibold text-foreground underline-offset-2 hover:text-primary hover:underline"
                >
                  {item.counterparty_name || t("Utilizator", "User")}
                </a>
              ) : (
                <p className="truncate text-sm font-semibold text-foreground">
                  {item.counterparty_name || t("Utilizator", "User")}
                </p>
              )}
              {stats && (
                stats.reviews_count > 0 ? (
                  <span className="inline-flex flex-shrink-0 items-center gap-0.5 text-xs font-semibold text-foreground">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    {stats.average_rating.toFixed(1)}
                    <span className="font-normal text-muted-foreground">({stats.reviews_count})</span>
                  </span>
                ) : (
                  <span className="flex-shrink-0 text-xs text-muted-foreground">{t("Fără recenzii", "No reviews")}</span>
                )
              )}
            </div>
            {since && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                {t("acum", "ago")} {since}
              </p>
            )}
          </div>
        </div>

        {/* Product card */}
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-muted/50 p-3">
          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-primary/10">
            {item.product_image ? (
              <img src={item.product_image} alt={item.product_title || ""} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{item.product_title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{periodLabel}</p>
            {!isRejected && (
              <p className="mt-0.5 text-sm font-bold text-primary">{totalLabel}</p>
            )}
          </div>
        </div>

        {/* Rejection explainer */}
        {isRejected && (
          <div className="mt-3 rounded-xl bg-muted/60 p-3">
            <p className="text-xs text-foreground/80">
              {isCancelledByOwner
                ? t(
                    "Proprietarul a anulat această rezervare înainte de plată. Nu ai fost taxat — nicio sumă nu a fost retrasă de pe metoda ta de plată.",
                    "The owner cancelled this booking before payment. You were not charged.",
                  )
                : t(
                    "Din păcate, proprietarul nu a putut accepta cererea ta pentru acest produs. Îți recomandăm să cauți produse similare disponibile.",
                    "Unfortunately, the owner could not accept your request for this item. We recommend looking for similar items available.",
                  )}
            </p>
          </div>
        )}

        {/* Optional message (owner mode only) */}
        {!isRejected && mode === "owner" && item.message_to_owner && (
          <div className="mt-3 rounded-xl bg-primary/5 p-3">
            <p className="flex items-start gap-2 text-xs text-foreground/80">
              <MessageCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
              <span className="italic">&quot;{item.message_to_owner}&quot;</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {mode === "owner" ? (
            <>
              <Button
                variant="outline"
                className="rounded-full w-full order-2 sm:order-none"
                disabled={busy !== null}
                onClick={() => handle("reject", onReject)}
              >
                {busy === "reject" ? t("Se trimite…", "Sending…") : t("Refuză", "Decline")}
              </Button>
              <Button
                className="rounded-full w-full order-1 sm:order-none"
                disabled={busy !== null}
                onClick={() => handle("accept", onAccept)}
              >
                {busy === "accept" ? t("Se trimite…", "Sending…") : t("Acceptă", "Accept")}
              </Button>
            </>
          ) : isRejected ? (
            <>
              <Button
                variant="outline"
                className="rounded-full w-full order-2 sm:order-none"
                disabled={busy !== null}
                onClick={onDismiss}
              >
                {t("Închide", "Close")}
              </Button>
              <Button
                className="rounded-full w-full order-1 sm:order-none"
                disabled={busy !== null}
                onClick={() => handle("similar", onViewSimilar)}
              >
                {busy === "similar" ? t("Se deschide…", "Opening…") : t("Vezi produse similare", "See similar items")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="rounded-full w-full order-2 sm:order-none"
                disabled={busy !== null}
                onClick={onDismiss}
              >
                {t("Mai târziu", "Later")}
              </Button>
              <Button
                className="rounded-full w-full order-1 sm:order-none"
                disabled={busy !== null}
                onClick={() => handle("product", onViewProduct)}
              >
                {busy === "product" ? t("Se deschide…", "Opening…") : t("Vezi închirierea", "View rental")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}