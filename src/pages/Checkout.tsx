import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, CreditCard, Info, Shield, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginDialog from "@/components/checkout/LoginDialog";
import TermsDialog from "@/components/checkout/TermsDialog";
import PremiumStepper from "@/components/checkout/PremiumStepper";
import PremiumBookingSummary from "@/components/checkout/PremiumBookingSummary";
import OptionalMessageCard from "@/components/checkout/OptionalMessageCard";
import WhatHappensNext from "@/components/checkout/WhatHappensNext";
import PaymentTrustStrip from "@/components/checkout/PaymentTrustStrip";
import StickyCheckoutBar from "@/components/checkout/StickyCheckoutBar";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { createRentalWithStripeCheckout, createRentalWithStripeTestCheckout } from "@/features/rentals/rentalsApi";
import { toast } from "sonner";
import { useKycGate } from "@/hooks/queries/useKycGate";
import KycGateBanner from "@/components/kyc/KycGateBanner";
import { useIsAdmin } from "@/hooks/queries/useAdminStats";
import { PhoneRequiredGate, PhoneRequiredDialog, usePhoneRequired } from "@/components/profile/PhoneRequiredGate";

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
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as CheckoutState;
  const copy = useUxCopy();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const kyc = useKycGate();
  const { data: isAdmin } = useIsAdmin(user?.id);

  const [currentStep, setCurrentStep] = useState(1);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const phoneGate = usePhoneRequired();
  const [messageToOwner, setMessageToOwner] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);

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

  const handleContinueToPayment = () => {
    if (!user) { setShowLoginDialog(true); return; }
    setCurrentStep(2);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleLoginSuccess = () => { setShowLoginDialog(false); setCurrentStep(2); };

  const handleStripeCheckout = async () => {
    if (isSubmitting) return;
    if (user && !kyc.isVerified) {
      toast.error(language === "ro"
        ? "Trebuie să-ți verifici identitatea înainte de a plăti."
        : "You must verify your identity before paying.");
      navigate("/verificare");
      return;
    }
    if (!phoneGate.requirePhone()) return;
    setIsSubmitting(true);
    try {
      const stripeUrl = await createRentalWithStripeCheckout({
        productId: product.id,
        ownerId: product.ownerId,
        startDate: format(new Date(startDate), "yyyy-MM-dd"),
        endDate: format(new Date(endDate), "yyyy-MM-dd"),
        rentalDays,
        dailyPrice: product.price,
        subtotal: totalPrice,
        platformFeePercent: product.platformFeePercent,
        paymentMethod: "stripe",
        messageToOwner: messageToOwner || undefined,
      });
      window.location.href = stripeUrl;
    } catch (e: any) {
      console.error("Stripe checkout error:", e);
      if (e?.code === "KYC_REQUIRED" || (typeof e?.message === "string" && e.message.includes("KYC_REQUIRED"))) {
        toast.error(language === "ro"
          ? "Verificare identitate necesară. Te redirecționăm."
          : "Identity verification required. Redirecting you.");
        setIsSubmitting(false);
        setTimeout(() => navigate("/verificare"), 600);
        return;
      }
      toast.error(e?.message || (language === "ro"
        ? "Eroare la inițierea plății. Încearcă din nou."
        : "Error initiating payment. Please try again."));
      setIsSubmitting(false);
    }
  };

  const handleStripeTestCheckout = async () => {
    if (isSubmitting) return;
    if (!user) { setShowLoginDialog(true); return; }
    if (!phoneGate.requirePhone()) return;
    setIsSubmitting(true);
    try {
      const stripeUrl = await createRentalWithStripeTestCheckout({
        productId: product.id,
        ownerId: product.ownerId,
        startDate: format(new Date(startDate), "yyyy-MM-dd"),
        endDate: format(new Date(endDate), "yyyy-MM-dd"),
        rentalDays,
        dailyPrice: product.price,
        subtotal: totalPrice,
        platformFeePercent: product.platformFeePercent,
        paymentMethod: "stripe",
        messageToOwner: messageToOwner || undefined,
      });
      toast.info(language === "ro"
        ? "Mod TEST: folosește cardul 4242 4242 4242 4242, orice CVC, dată viitoare."
        : "TEST mode: use card 4242 4242 4242 4242, any CVC, future date.");
      setTimeout(() => { window.location.href = stripeUrl; }, 400);
    } catch (e: any) {
      console.error("Stripe TEST checkout error:", e);
      toast.error(e?.message || "Eroare la inițierea plății de test.");
      setIsSubmitting(false);
    }
  };

  const steps = [
    t("Confirmă rezervarea", "Confirm booking"),
    t("Plată securizată", "Secure payment"),
  ];

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => (currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate(-1))}
            className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            aria-label={t("Înapoi", "Back")}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-heading text-base md:text-xl font-semibold flex-1 truncate">
            {t("Finalizează rezervarea", "Complete your booking")}
          </h1>
        </div>
        <div className="border-t border-border/60 bg-card/40">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <PremiumStepper currentStep={currentStep} steps={steps} />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        {user && !kyc.isVerified && !kyc.loading && (
          <div className="mb-5 animate-fade-in">
            <KycGateBanner reason="book" />
          </div>
        )}
        <PhoneRequiredGate className="mb-5" />
        <PhoneRequiredDialog open={phoneGate.dialogOpen} onOpenChange={phoneGate.setDialogOpen} />

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
          {/* Left column — content */}
          <div className="space-y-4 min-w-0 order-2 lg:order-1">
            {currentStep === 1 ? (
              <>
                <div className="animate-fade-in" style={{ animationDelay: "0ms" }}>
                  <OptionalMessageCard value={messageToOwner} onChange={setMessageToOwner} />
                </div>
                <div className="animate-fade-in" style={{ animationDelay: "60ms" }}>
                  <WhatHappensNext />
                </div>
                <div className="hidden md:flex justify-end pt-2">
                  <Button
                    size="lg"
                    onClick={handleContinueToPayment}
                    className="h-12 px-6 shadow-lg shadow-primary/20"
                  >
                    {t("Continuă către plată", "Continue to payment")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-card rounded-2xl border border-border p-5 space-y-4 animate-fade-in">
                  <div>
                    <h2 className="font-semibold text-lg text-foreground">
                      {t("Plată securizată", "Secure payment")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t(
                        "Suma este blocată pe card și debitată doar după predarea produsului.",
                        "The amount is held on your card and charged only after handover."
                      )}
                    </p>
                  </div>
                  <PaymentTrustStrip />
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 animate-fade-in" style={{ animationDelay: "60ms" }}>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <Shield className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-emerald-900">
                      {t(
                        "Plata este protejată prin Stripe. Banii ajung la proprietar doar după predarea produsului.",
                        "Your payment is protected by Stripe. Funds reach the owner only after handover."
                      )}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground mt-4">
                    {copy.checkout.termsNotice}{" "}
                    <button type="button" className="text-primary hover:underline" onClick={() => setShowTermsDialog(true)}>
                      {copy.checkout.termsLink}
                    </button>{" "}
                    {copy.checkout.and}{" "}
                    <button type="button" className="text-primary hover:underline">
                      {copy.checkout.privacyLink}
                    </button>.
                  </p>

                  <Button
                    onClick={handleStripeCheckout}
                    className="w-full h-12 mt-4 text-base font-semibold shadow-lg shadow-primary/20"
                    size="lg"
                    disabled={isSubmitting || !phoneGate.hasValidPhone}
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    {isSubmitting
                      ? t("Se procesează...", "Processing...")
                      : t(`Plătește ${totalPrice} RON`, `Pay ${totalPrice} RON`)}
                  </Button>

                  {isAdmin && (
                    <div className="mt-3 rounded-xl border border-dashed border-yellow-400 bg-yellow-50/60 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-yellow-800 mb-2 flex items-center gap-1">
                        <FlaskConical className="h-3.5 w-3.5" />
                        {t("Mod admin — testare", "Admin — testing mode")}
                      </p>
                      <Button
                        onClick={handleStripeTestCheckout}
                        variant="outline"
                        className="w-full h-10 text-sm border-yellow-500 text-yellow-900 hover:bg-yellow-100"
                        size="sm"
                        disabled={isSubmitting}
                      >
                        <FlaskConical className="mr-2 h-4 w-4" />
                        {t("Plătește cu card de test (4242)", "Pay with test card (4242)")}
                      </Button>
                      <p className="mt-2 text-[10px] text-yellow-800/80 leading-snug">
                        {t(
                          "Nu se debitează bani reali. Rezervarea va fi marcată „Test" în dashboard.",
                          "No real money is charged. Booking will be flagged as „Test" in the dashboard."
                        )}
                      </p>
                    </div>
                  )}

                  <p className="mt-3 text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                    <Info className="h-3 w-3" />
                    {t("Vei fi redirecționat către pagina securizată Stripe", "You will be redirected to the secure Stripe page")}
                  </p>
                </div>
              </>
            )}
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
        total={totalPrice}
        ctaLabel={
          currentStep === 1
            ? t("Continuă", "Continue")
            : t(`Plătește ${totalPrice} RON`, `Pay ${totalPrice} RON`)
        }
        onClick={currentStep === 1 ? handleContinueToPayment : handleStripeCheckout}
        loading={isSubmitting}
        disabled={currentStep === 2 && !phoneGate.hasValidPhone}
      />

      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLoginSuccess={handleLoginSuccess} />
      <TermsDialog open={showTermsDialog} onOpenChange={setShowTermsDialog} onAccept={handleStripeCheckout} isSubmitting={isSubmitting} />
    </div>
  );
};

export default Checkout;
