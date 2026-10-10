import { CheckCircle, CalendarDays, FileSignature, Camera, MapPin, ShieldCheck, ArrowRight, MessageCircle, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Confetti from "@/components/common/Confetti";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rentalId: string;
  publicId?: string | null;
  productTitle?: string | null;
  productImage?: string | null;
  period: string;
  rentalDays: number;
  handoverDate: string;
  total: number;
  onContinue: () => void;
  onChat: () => void;
  t: (ro: string, en: string) => string;
}

export default function WalletPaymentSuccessModal({
  open, onOpenChange, rentalId, publicId, productTitle, productImage, period, rentalDays, handoverDate, total, onContinue, onChat, t,
}: Props) {
  const steps = [
    { icon: FileSignature, title: t("Semnați contractul", "Sign the contract"), text: t("Ambele părți semnează digital, cu cod SMS.", "Both parties sign digitally with an SMS code.") },
    { icon: CalendarDays, title: t("Stabiliți întâlnirea", "Agree on the meeting"), text: t("Alegeți intervalul de 2 ore și locul predării.", "Pick the 2-hour slot and handover place.") },
    { icon: Camera, title: t("La predare", "At handover"), text: t(`Pe ${handoverDate} verificați bunul și semnați procesul-verbal.`, `On ${handoverDate} check the item and sign the handover report.`) },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto p-0">
        {open && <Confetti onceKey={`paid-${rentalId}`} />}
        <div className="p-6 pb-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-primary">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10"><CheckCircle className="h-5 w-5" /></div>
            <span className="text-[11px] font-bold uppercase tracking-wider">{t("Plată confirmată din wallet", "Paid from wallet")}</span>
            {publicId && <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{publicId}</span>}
          </div>
          <DialogTitle className="font-heading text-2xl font-extrabold leading-tight">{t("Felicitări! Produsul a fost rezervat!", "Congratulations! The item is booked!")}</DialogTitle>
          <DialogDescription className="mt-2 flex items-center gap-3">
            {productImage && <img src={productImage} alt="" className="h-12 w-12 rounded-lg border border-border object-cover" />}
            <span className="font-semibold text-foreground">{productTitle}</span>
          </DialogDescription>
        </div>

        <div className="grid border-y border-border sm:grid-cols-3">
          <div className="p-4 sm:border-r sm:border-border">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">{t("Perioada", "Period")}</p>
            <p className="mt-1 text-sm font-bold">{period}</p>
            <p className="text-xs text-muted-foreground">{rentalDays} {t("zile", "days")}</p>
          </div>
          <div className="border-t border-border p-4 sm:border-r sm:border-t-0">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground"><MapPin className="h-3 w-3 text-primary" />{t("Data predării", "Handover")}</p>
            <p className="mt-1 text-sm font-bold capitalize">{handoverDate}</p>
          </div>
          <div className="border-t border-border p-4 sm:border-t-0">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground"><Wallet className="h-3 w-3 text-primary" />{t("Total plătit", "Total paid")}</p>
            <p className="mt-1 text-sm font-bold text-primary">{total} RON</p>
          </div>
        </div>

        <div className="px-6 pt-4">
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {t("Suma este păstrată în siguranță și ajunge la proprietar doar după predarea confirmată prin proces-verbal.", "The amount is held safely and released to the owner only after the confirmed handover.")}
          </p>
        </div>

        <div className="m-6 mt-4 rounded-xl border-l-2 border-primary bg-primary/10 p-4">
          <h3 className="text-sm font-bold">{t("Pașii următori", "Next steps")}</h3>
          <ol className="mt-3 space-y-3">
            {steps.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                <strong className="flex items-center gap-2 text-foreground"><s.icon className="h-4 w-4 text-primary" />0{i + 1} · {s.title}</strong>
                {s.text}
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-2 px-6 pb-6 sm:flex-row">
          <Button className="flex-1" onClick={onContinue}>{t("Continuă la contract", "Continue to contract")}<ArrowRight className="ml-2 h-4 w-4" /></Button>
          <Button variant="outline" className="flex-1" onClick={onChat}><MessageCircle className="mr-2 h-4 w-4" />{t("Discută cu proprietarul", "Chat with owner")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
