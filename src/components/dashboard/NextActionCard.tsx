import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Hourglass, ShieldCheck, Truck, ClipboardCheck, Package, RotateCcw, CheckCircle2, MessageCircle, ArrowRight, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUxCopy } from "@/hooks/useUxCopy";
import { cn } from "@/lib/utils";
import SupportFromRentalButton from "./SupportFromRentalButton";

type Role = "renter" | "owner";

interface RentalLike {
  id: string;
  public_id?: string | null;
  product_id?: string | null;
  product_title?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  payment_status?: string | null;
  handover_confirmed_at?: string | null;
  return_confirmed_at?: string | null;
}

interface Props {
  rental: RentalLike;
  step: number;
  cancelled?: boolean;
  role: Role;
  /** Whether the renter has already submitted the check-in (handover) inspection. */
  renterCheckinSubmitted?: boolean;
  onPrimary?: () => void;
  onChat?: () => void;
  onLeaveReview?: () => void;
}

const NextActionCard = ({
  rental, step, cancelled, role, renterCheckinSubmitted,
  onPrimary, onChat, onLeaveReview,
}: Props) => {
  const copy = useUxCopy();
  const t = copy.timeline.nextAction;
  const navigate = useNavigate();

  if (cancelled) return null;

  type Variant = {
    icon: ReactNode;
    title: string;
    desc: string;
    cta?: string;
    onCta?: () => void;
    accent: string;
  };

  const handleChat = onChat ?? (() => navigate("/mesaje"));

  const buildVariant = (): Variant | null => {
    const c = role === "renter" ? t.renter : t.owner;
    const accentByStep: Record<number, string> = {
      1: "from-amber-50 to-amber-100/60 border-amber-200 text-amber-700",
      2: "from-orange-50 to-orange-100/60 border-orange-200 text-orange-700",
      3: "from-[#fff5ec] to-[#ffe7d3] border-[#F98715]/30 text-[#b85a00]",
      4: "from-sky-50 to-sky-100/60 border-sky-200 text-sky-700",
      5: "from-rose-50 to-rose-100/60 border-rose-200 text-rose-700",
      6: "from-violet-50 to-violet-100/60 border-violet-200 text-violet-700",
      7: "from-emerald-50 to-emerald-100/60 border-emerald-200 text-emerald-700",
    };
    const accent = accentByStep[step] ?? accentByStep[1];

    if (role === "renter") {
      const r = c as typeof t.renter;
      switch (step) {
        case 1: return { icon: <Hourglass className="h-5 w-5" />, ...r.pendingPayment, accent };
        case 2: return { icon: <ShieldCheck className="h-5 w-5" />, ...r.awaitingOwner, accent };
        case 3: return { icon: <Truck className="h-5 w-5" />, ...r.approvedPrePickup, accent };
        case 4: return { icon: <ClipboardCheck className="h-5 w-5" />, ...r.confirmReceipt, onCta: onPrimary, accent };
        case 5: return { icon: <Package className="h-5 w-5" />, ...r.inUse, accent };
        case 6: return { icon: <RotateCcw className="h-5 w-5" />, ...r.returnDay, accent };
        case 7: return { icon: <CheckCircle2 className="h-5 w-5" />, ...r.completed, onCta: onLeaveReview, accent };
      }
    } else {
      const o = c as typeof t.owner;
      switch (step) {
        case 1:
        case 2: return { icon: <Hourglass className="h-5 w-5" />, ...o.pending, accent };
        case 3: return { icon: <Truck className="h-5 w-5" />, ...o.approvedPrePickup, onCta: onPrimary, accent };
        case 4: return renterCheckinSubmitted
          ? { icon: <ClipboardCheck className="h-5 w-5" />, ...o.inTransit, onCta: onPrimary, accent }
          : { icon: <ClipboardCheck className="h-5 w-5" />, ...o.awaitingRenterConfirm, accent };
        case 5: return { icon: <Package className="h-5 w-5" />, ...o.inUse, accent };
        case 6: return { icon: <RotateCcw className="h-5 w-5" />, ...o.confirmReturn, onCta: onPrimary, accent };
        case 7: return { icon: <CheckCircle2 className="h-5 w-5" />, ...o.completed, onCta: onLeaveReview, accent };
      }
    }
    return null;
  };

  const v = buildVariant();
  if (!v) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-br p-4 sm:p-5 animate-fade-in",
        v.accent,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
          {v.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider font-semibold opacity-80">{t.title}</p>
          <h4 className="mt-0.5 font-heading text-base sm:text-lg font-semibold text-foreground">
            {v.title}
          </h4>
          <p className="mt-1 text-sm text-foreground/80">{v.desc}</p>

          {(v.cta && v.onCta) && (
            <Button onClick={v.onCta} className="mt-3" size="sm">
              {v.cta}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleChat} className="bg-white/70">
              <MessageCircle className="h-4 w-4 mr-1" />
              {role === "renter" ? t.contactOwner : t.contactRenter}
            </Button>
            <SupportFromRentalButton
              rentalId={rental.id}
              rentalPublicId={rental.public_id || null}
              productTitle={rental.product_title}
              className="bg-white/70 border border-border/50"
            />
            {step === 7 && onLeaveReview && (
              <Button variant="outline" size="sm" onClick={onLeaveReview} className="bg-white/70">
                <Star className="h-4 w-4 mr-1" />
                {role === "renter" ? copy.timeline.nextAction.renter.completed.cta : copy.timeline.nextAction.owner.completed.cta}
              </Button>
            )}
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground">{t.keepOnPlatform}</p>
        </div>
      </div>
    </div>
  );
};

export default NextActionCard;