import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, ImageOff, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { StatusBadge, type EarningsStatus } from "./statusBadge";
import type { EarningsTransaction } from "@/hooks/useEarnings";

interface Props {
  tx: EarningsTransaction | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const TransactionDetailDrawer = ({ tx, open, onOpenChange }: Props) => {
  const { t, language } = useLanguage();
  if (!tx) return null;

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(language === "ro" ? "ro-RO" : "en-GB") : "—";

  const copy = (val: string) => {
    navigator.clipboard.writeText(val);
    toast.success(t("Copiat", "Copied"));
  };

  const Row = ({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) => (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>{t("Detalii tranzacție", "Transaction details")}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          <div className="flex gap-3">
            {tx.productImage ? (
              <img src={tx.productImage} alt="" className="h-20 w-20 rounded-xl object-cover" />
            ) : (
              <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center">
                <ImageOff className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold leading-tight">{tx.productTitle}</p>
              <div className="mt-2">
                <StatusBadge status={tx.status as EarningsStatus} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{t("Câștigi", "You earn")}</span>
              <span className="text-2xl font-bold text-emerald-700 tabular-nums">
                {tx.ownerPayout.toFixed(2)} RON
              </span>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground mb-2">
              {t("Detalii financiare", "Financial breakdown")}
            </p>
            <Row label={t("Subtotal închiriere", "Rental subtotal")} value={`${tx.subtotal.toFixed(2)} RON`} />
            <Row label={t("Comision platformă", "Platform fee")} value={`-${tx.platformFee.toFixed(2)} RON`} />
            <Row
              label={<span className="font-semibold text-foreground">{t("Sumă netă", "Net amount")}</span> as any}
              value={<span className="text-emerald-700">{tx.ownerPayout.toFixed(2)} RON</span>}
            />
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground mb-2">
              {t("Rezervare", "Booking")}
            </p>
            {tx.renterId && (
              <div className="flex items-center justify-between gap-3 py-2.5 border-b">
                <span className="text-xs text-muted-foreground">{t("Chiriaș", "Renter")}</span>
                <Link
                  to={`/utilizator/${tx.renterId}`}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  {tx.renterAvatar ? (
                    <img src={tx.renterAvatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                      <UserIcon className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm font-medium">{tx.renterName || t("Utilizator", "User")}</span>
                </Link>
              </div>
            )}
            <Row label={t("Perioada", "Period")} value={`${fmt(tx.startDate)} – ${fmt(tx.endDate)}`} />
            <Row label={t("Data tranzacției", "Transaction date")} value={fmt(tx.date)} />
            {tx.rentalPublicId && (
              <Row
                label={t("ID rezervare", "Booking ID")}
                mono
                value={
                  <button
                    onClick={() => copy(tx.rentalPublicId!)}
                    className="inline-flex items-center gap-1 hover:text-primary"
                  >
                    {tx.rentalPublicId}
                    <Copy className="h-3 w-3" />
                  </button>
                }
              />
            )}
          </div>

          {tx.rentalPublicId && (
            <Button asChild variant="outline" className="w-full">
              <Link to={`/inchirieri/${tx.rentalPublicId}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                {t("Vezi rezervarea", "View booking")}
              </Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TransactionDetailDrawer;