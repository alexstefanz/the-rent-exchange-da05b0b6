import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, MessageCircle, ArrowRight, CalendarDays, ShieldCheck, MapPin, FileSignature, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrCreateRentalConversation } from "@/features/messaging/messagingApi";
import { toast } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import Confetti from "@/components/common/Confetti";

interface BookingConfirmationProps {
  productTitle: string;
  productImage?: string;
  publicId?: string | null;
  startDate: string;
  endDate: string;
  handoverDate: string;
  totalPrice: number;
  rentalDays: number;
  rentalId: string;
}

const BookingConfirmation = ({
  productTitle, productImage, publicId, startDate, endDate, handoverDate, totalPrice, rentalDays, rentalId,
}: BookingConfirmationProps) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (ro: string, en: string) => (language === "en" ? en : ro);
  const [isOpeningChat, setIsOpeningChat] = useState(false);

  const handleOpenChat = async () => {
    setIsOpeningChat(true);
    try {
      const conversationId = await getOrCreateRentalConversation(rentalId);
      if (conversationId) {
        navigate(`/mesaje?conv=${conversationId}`, {
          state: { returnTo: { pathname: window.location.pathname, search: window.location.search } },
        });
      } else toast.error(t("Nu s-a putut deschide conversația.", "Could not open the conversation."));
    } catch {
      toast.error(t("Eroare la deschiderea conversației.", "Error opening the conversation."));
    } finally {
      setIsOpeningChat(false);
    }
  };

  const steps = [
    { icon: CalendarDays, title: t("Stabiliți întâlnirea", "Agree on the meeting"), text: t("Alegeți împreună intervalul de 2 ore și locul exact al predării.", "Pick a 2-hour slot and the exact handover place together.") },
    { icon: FileSignature, title: t("Semnați contractul", "Sign the contract"), text: t("Ambele părți semnează contractul în pagina închirierii, cu cod SMS.", "Both parties sign the contract on the rental page with an SMS code.") },
    { icon: Camera, title: t("La predare", "At handover"), text: t(`Bunul se preia ${handoverDate}. Procesul-verbal se deschide doar în ziua predării; fără PV semnat de ambele părți, predarea nu este validată.`, `Pick-up is on ${handoverDate}. The handover report opens only on that day; without it signed by both, the handover is not validated.`) },
  ];

  return (
    <div className="py-6">
      <Confetti onceKey={`paid-${rentalId}`} />
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm animate-fade-up">
        <div className="grid sm:grid-cols-[1fr_200px]">
          <div className="p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3 text-primary">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10"><CheckCircle className="h-5 w-5" /></div>
              <span className="text-[11px] font-bold uppercase tracking-wider">{t("Plată confirmată", "Payment confirmed")}</span>
              {publicId && <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{publicId}</span>}
            </div>
            <h1 className="font-heading text-2xl font-extrabold leading-tight md:text-3xl">{t("Felicitări! Produsul a fost rezervat!", "Congratulations! The item is booked!")}</h1>
            <p className="mt-2 text-sm text-muted-foreground"><span className="font-semibold text-foreground">{productTitle}</span></p>
            <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {t("Plata este păstrată în siguranță și ajunge la proprietar doar după predarea confirmată prin proces-verbal.", "Your payment is held safely and released to the owner only after the handover is confirmed.")}
            </p>
          </div>
          {productImage && (
            <div className="relative min-h-40 bg-muted">
              <img src={productImage} alt={productTitle} className="absolute inset-0 h-full w-full object-cover" />
            </div>
          )}
        </div>

        <div className="grid border-t border-border sm:grid-cols-3">
          <div className="p-5 sm:border-r sm:border-border">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />{t("Data predării", "Handover date")}</p>
            <p className="mt-1 text-lg font-bold capitalize">{handoverDate}</p>
            <p className="text-xs text-muted-foreground">{t("Ora și locul le stabiliți împreună", "Time and place to be agreed")}</p>
          </div>
          <div className="border-t border-border p-5 sm:border-r sm:border-t-0">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">{t("Perioada închirierii", "Rental period")}</p>
            <p className="mt-1 text-lg font-bold">{startDate} – {endDate}</p>
            <p className="text-xs text-muted-foreground">{rentalDays} {t("zile", "days")}</p>
          </div>
          <div className="border-t border-border p-5 sm:border-t-0">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">{t("Total plătit", "Total paid")}</p>
            <p className="mt-1 text-lg font-bold text-primary">{totalPrice} RON</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border-l-2 border-primary bg-primary/10 p-5 animate-fade-up" style={{ animationDelay: "0.15s" }}>
        <h2 className="text-sm font-bold">{t("Pașii următori", "Next steps")}</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={i} className="text-sm text-muted-foreground">
              <strong className="mb-1 flex items-center gap-2 text-foreground"><s.icon className="h-4 w-4 text-primary" />0{i + 1} · {s.title}</strong>
              {s.text}
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row animate-fade-up" style={{ animationDelay: "0.25s" }}>
        <Button className="flex-1" asChild>
          <Link to={`/rezervari/${publicId || rentalId}`}>
            {t("Stabilește ora predării", "Set the handover time")}<ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleOpenChat} disabled={isOpeningChat}>
          <MessageCircle className="mr-2 h-4 w-4" />
          {isOpeningChat ? t("Se deschide...", "Opening...") : t("Discută cu proprietarul", "Chat with the owner")}
        </Button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
