import { usePageSeo } from "@/hooks/usePageSeo";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginDialog from "@/components/checkout/LoginDialog";
import TermsDialog from "@/components/checkout/TermsDialog";
import PrivacyDialog from "@/components/checkout/PrivacyDialog";
import PremiumBookingSummary from "@/components/checkout/PremiumBookingSummary";
import StickyCheckoutBar from "@/components/checkout/StickyCheckoutBar";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { createRentalRequest } from "@/features/rentals/rentalsApi";
import { toast } from "@/components/ui/sonner";
import { notify } from "@/lib/notify";
import { PhoneRequiredGate, PhoneRequiredDialog, usePhoneRequired } from "@/components/profile/PhoneRequiredGate";
import { getOrCreateConversation } from "@/features/messaging/messagingApi";
import { calcClientTotal } from "@/lib/rentalPricing";

interface CheckoutState {
  product: {
    id: string;
    title: string;
    images: string[];
    price: number;
    priceUnit: string;
    location: string;
    ownerId: string;
    platformFeePercent?: number;
  };
  startDate: Date;
  endDate: Date;
  rentalDays: number;
  totalPrice: number;
}

const Checkout = () => {
  usePageSeo({ title: "Finalizare rezervare — Rentli", description: "Zona privată a contului tău Rentli.", noindex: true });
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as CheckoutState;
  const copy = useUxCopy();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const phoneGate = usePhoneRequired();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);

  if (!state) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{copy.checkout.noData}</p>
          <Button onClick={() => navigate(-1)}>{copy.common.back}</Button>
        </div>
      </div>
    );
  }

  const { product, startDate, endDate, rentalDays, totalPrice } = state;
  // `totalPrice` from ProductDetail is the owner-net subtotal. The client total
  // (charged by Stripe) adds the platform fee with a 1 RON minimum.
  const clientTotal = calcClientTotal(totalPrice, product.platformFeePercent ?? 0);

  if (user && user.id === product.ownerId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 text-center space-y-3">
          <h1 className="font-heading text-lg font-semibold text-foreground">
            {t("Nu poți închiria propriul tău produs", "You can't rent your own listing")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("Acesta este anunțul tău. Rezervările pot fi făcute doar de alți utilizatori.", "This is your listing. Only other users can book it.")}
          </p>
          <Button onClick={() => navigate(-1)}>{t("Înapoi la anunț", "Back to listing")}</Button>
        </div>
      </div>
    );
  }

  const handleOpenChat = async () => {
    if (!user) { setShowLoginDialog(true); return; }
    if (openingChat) return;
    setOpeningChat(true);
    try {
      const conv = await getOrCreateConversation(product.id, product.ownerId);
      if (conv) {
        if (user) queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
        navigate(`/mesaje?conv=${conv.id}`, {
          state: {
            returnTo: {
              pathname: "/checkout",
              search: "",
              state,
            },
          },
        });
      } else {
        toast.error(t("Nu am putut deschide conversația.", "Couldn't open the conversation."));
      }
    } catch (e: any) {
      console.error("Open chat error:", e);
      toast.error(t("Nu am putut deschide conversația.", "Couldn't open the conversation."));
    } finally {
      setOpeningChat(false);
    }
  };

  const handleSendRequest = async () => {
    if (!user) { setShowLoginDialog(true); return; }
    if (isSubmitting) return;
    if (!phoneGate.requirePhone()) return;
    setIsSubmitting(true);
    try {
      const rental = await createRentalRequest({
        productId: product.id,
        ownerId: product.ownerId,
        startDate: format(new Date(startDate), "yyyy-MM-dd"),
        endDate: format(new Date(endDate), "yyyy-MM-dd"),
        rentalDays,
        dailyPrice: product.price,
        subtotal: totalPrice,
        platformFeePercent: product.platformFeePercent,
        paymentMethod: "stripe",
      });
      const target = (rental as any)?.public_id
        ? `/rezervari/${(rental as any).public_id}`
        : "/rezervari";
      navigate(target, { replace: true });
    } catch (e: any) {
      console.error("Send request error:", e);
      toast.error(e?.message || (language === "ro"
        ? "Eroare la trimiterea cererii. Încearcă din nou."
        : "Error sending the request. Please try again."));
      setIsSubmitting(false);
    }
  };
  const handleLoginSuccess = () => { setShowLoginDialog(false); handleSendRequest(); };

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            aria-label={t("Înapoi", "Back")}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-heading text-base md:text-xl font-semibold flex-1 truncate">
            {t("Finalizează rezervarea", "Complete your booking")}
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        <PhoneRequiredGate className="mb-5" />
        <PhoneRequiredDialog open={phoneGate.dialogOpen} onOpenChange={phoneGate.setDialogOpen} />

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
          {/* Left column — content */}
          <div className="space-y-4 min-w-0 order-2 lg:order-1">
            <div className="animate-fade-in rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {t("Ai întrebări înainte de rezervare?", "Questions before booking?")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("Vorbește direct cu proprietarul prin chat.", "Chat directly with the owner.")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenChat}
                    disabled={openingChat}
                    className="shrink-0"
                  >
                    {t("Deschide chat", "Open chat")}
                  </Button>
            </div>

            <div className="bg-card rounded-2xl border border-border p-5 animate-fade-in">
                  <h2 className="font-semibold text-lg text-foreground">
                    {t("Trimite cererea de închiriere", "Send your rental request")}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {t(
                      "Cardul nu este debitat acum. După acceptare primești linkul de plată securizată.",
                      "No charge now. After acceptance you'll get a secure payment link."
                    )}
                  </p>

                  <p className="text-xs text-muted-foreground mt-4">
                    {copy.checkout.termsNotice}{" "}
                    <button type="button" className="text-primary hover:underline" onClick={() => setShowTermsDialog(true)}>
                      {copy.checkout.termsLink}
                    </button>{" "}
                    {copy.checkout.and}{" "}
                    <button type="button" className="text-primary hover:underline" onClick={() => setShowPrivacyDialog(true)}>
                      {copy.checkout.privacyLink}
                    </button>.
                  </p>

                  <Button
                    onClick={handleSendRequest}
                    className="w-full h-12 mt-4 text-base font-semibold shadow-lg shadow-primary/20"
                    size="lg"
                    disabled={isSubmitting || !phoneGate.hasValidPhone}
                  >
                    <Send className="mr-2 h-5 w-5" />
                    {isSubmitting
                      ? t("Se trimite...", "Sending...")
                      : t("Trimite cererea", "Send request")}
                  </Button>
            </div>
          </div>

          {/* Right column — sticky summary */}
          <aside className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-32">
              <PremiumBookingSummary
                product={product}
                startDate={new Date(startDate)}
                endDate={new Date(endDate)}
                rentalDays={rentalDays}
                totalPrice={totalPrice}
              />
            </div>
          </aside>
        </div>
      </main>

      <StickyCheckoutBar
        total={clientTotal}
        ctaLabel={t("Trimite cererea", "Send request")}
        onClick={handleSendRequest}
        loading={isSubmitting}
        disabled={!phoneGate.hasValidPhone}
      />

      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLoginSuccess={handleLoginSuccess} />
      <TermsDialog open={showTermsDialog} onOpenChange={setShowTermsDialog} onAccept={handleSendRequest} isSubmitting={isSubmitting} />
      <PrivacyDialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog} />
    </div>
  );
};

export default Checkout;
