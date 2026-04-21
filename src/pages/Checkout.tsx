import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { ArrowLeft, ChevronDown, ChevronUp, Shield, Info, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import LoginDialog from "@/components/checkout/LoginDialog";
import TermsDialog from "@/components/checkout/TermsDialog";
import ProgressIndicator from "@/components/booking/ProgressIndicator";
import ReassuranceMessage from "@/components/trust/ReassuranceMessage";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { createRentalWithStripeCheckout } from "@/features/rentals/rentalsApi";
import { toast } from "sonner";
import { useKycGate } from "@/hooks/queries/useKycGate";
import KycGateBanner from "@/components/kyc/KycGateBanner";

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
  const { language } = useLanguage();
  const { user } = useAuth();
  const kyc = useKycGate();
  const dateLocale = language === "ro" ? ro : enUS;

  const [currentStep, setCurrentStep] = useState(1);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
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

  const handleNextStep1 = () => { if (!user) { setShowLoginDialog(true); } else { setCurrentStep(2); } };
  const handleLoginSuccess = () => { setShowLoginDialog(false); setCurrentStep(2); };

  const handleStripeCheckout = async () => {
    if (isSubmitting) return;
    if (user && !kyc.isVerified) {
      toast.error("Trebuie să-ți verifici identitatea înainte de a plăti.");
      navigate("/kyc");
      return;
    }
    setIsSubmitting(true);
    try {
      const stripeUrl = await createRentalWithStripeCheckout({
        productId: product.id,
        ownerId: product.ownerId,
        startDate: format(new Date(startDate), "yyyy-MM-dd"),
        endDate: format(new Date(endDate), "yyyy-MM-dd"),
        rentalDays,
        dailyPrice: product.price,
        platformFeePercent: product.platformFeePercent,
        paymentMethod: "stripe",
        messageToOwner: messageToOwner || undefined,
      });
      window.location.href = stripeUrl;
    } catch (e: any) {
      console.error("Stripe checkout error:", e);
      if (e?.code === "KYC_REQUIRED" || (typeof e?.message === "string" && e.message.includes("KYC_REQUIRED"))) {
        toast.error("Verificare identitate necesară. Te redirecționăm.");
        setIsSubmitting(false);
        setTimeout(() => navigate("/kyc"), 600);
        return;
      }
      toast.error(e?.message || "Eroare la inițierea plății. Încearcă din nou.");
      setIsSubmitting(false);
    }
  };

  const steps = [
    copy.booking.steps.message,
    copy.checkout.payment,
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate(-1)} className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-heading text-xl md:text-2xl font-semibold">{copy.checkout.title}</h1>
        </div>
      </header>

      <div className="border-b border-border bg-card/50 py-4">
        <div className="max-w-4xl mx-auto px-4">
          <ProgressIndicator currentStep={currentStep} steps={steps} totalSteps={2} />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {user && !kyc.isVerified && !kyc.loading && (
          <div className="mb-6">
            <KycGateBanner reason="book" />
          </div>
        )}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            {/* Step 1 - Message to owner */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <button onClick={() => setCurrentStep(1)} className={`w-full px-6 py-4 flex items-center justify-between text-left ${currentStep !== 1 && currentStep > 1 ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{currentStep > 1 ? '✓' : '1'}</div>
                  <h2 className="font-semibold text-lg">{copy.checkout.messageToOwner}</h2>
                </div>
                {currentStep === 1 ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </button>
              {currentStep === 1 && (
                <div className="px-6 pb-6">
                  <p className="text-muted-foreground text-sm mb-4">{copy.checkout.messageDesc}</p>
                  <Textarea placeholder={copy.booking.messagePlaceholder} value={messageToOwner} onChange={(e) => setMessageToOwner(e.target.value)} className="min-h-[100px]" />
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleNextStep1} className="px-8">{copy.common.continue}</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 - Pay with Stripe */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <button onClick={() => currentStep >= 2 && setCurrentStep(2)} className={`w-full px-6 py-4 flex items-center justify-between text-left ${currentStep < 2 ? 'opacity-60' : ''}`} disabled={currentStep < 2}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
                  <h2 className="font-semibold text-lg">{copy.checkout.payment}</h2>
                </div>
                {currentStep === 2 && <ChevronUp className="h-5 w-5 text-muted-foreground" />}
              </button>
              {currentStep === 2 && (
                <div className="px-6 pb-6">
                  <ReassuranceMessage type="payment" className="mb-4" />

                  {/* Summary */}
                  <div className="space-y-3 text-sm mb-6">
                    <div className="flex justify-between"><span className="text-muted-foreground">{copy.checkout.product}</span><span className="font-medium">{product.title}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{copy.checkout.period}</span><span className="font-medium">{format(new Date(startDate), "d MMM", { locale: dateLocale })} - {format(new Date(endDate), "d MMM yyyy", { locale: dateLocale })}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{copy.checkout.duration}</span><span className="font-medium">{rentalDays} {copy.checkout.days}</span></div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-base font-semibold"><span>{copy.checkout.totalToPay}</span><span className="text-primary">{totalPrice} RON</span></div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-4">
                    {copy.checkout.termsNotice} <span className="text-primary hover:underline cursor-pointer" onClick={() => setShowTermsDialog(true)}>{copy.checkout.termsLink}</span> {copy.checkout.and} <span className="text-primary hover:underline cursor-pointer">{copy.checkout.privacyLink}</span>.
                  </p>

                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-muted-foreground mb-4 flex items-start gap-2">
                    <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>
                      {language === "ro"
                        ? "Suma va fi blocată temporar pe cardul tău și debitată doar după finalizarea perioadei de închiriere."
                        : "The amount will be temporarily held on your card and charged only after the rental period ends."}
                    </span>
                  </div>

                  <Button
                    onClick={handleStripeCheckout}
                    className="w-full h-12"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    {isSubmitting
                      ? "Se procesează..."
                      : language === "ro"
                        ? `Rezervă — ${totalPrice} RON`
                        : `Reserve — ${totalPrice} RON`}
                  </Button>

                  <p className="mt-3 text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                    <Info className="h-3 w-3" />
                    {language === "ro"
                      ? "Vei fi redirecționat către pagina securizată Stripe"
                      : "You will be redirected to the secure Stripe page"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:order-first">
            <div className="sticky top-6 bg-card rounded-xl border border-border p-6">
              <div className="flex gap-4">
                <img src={product.images[0]} alt={product.title} className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{product.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{product.location}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <h4 className="font-semibold mb-3">{copy.booking.priceBreakdown.subtotal}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{product.price} RON × {rentalDays} {copy.checkout.days}</span><span>{totalPrice} RON</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{copy.booking.priceBreakdown.serviceFee}</span><span>0 RON</span></div>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-semibold"><span>{copy.booking.priceBreakdown.total}</span><span>{totalPrice} RON</span></div>
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                <div className="flex justify-between text-muted-foreground"><span>{copy.checkout.checkIn}</span><span className="font-medium text-foreground">{format(new Date(startDate), "d MMMM yyyy", { locale: dateLocale })}</span></div>
                <div className="flex justify-between text-muted-foreground mt-1"><span>{copy.checkout.checkOut}</span><span className="font-medium text-foreground">{format(new Date(endDate), "d MMMM yyyy", { locale: dateLocale })}</span></div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-primary" />
                <span>{copy.booking.freeCancellation}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLoginSuccess={handleLoginSuccess} />
      <TermsDialog open={showTermsDialog} onOpenChange={setShowTermsDialog} onAccept={handleStripeCheckout} isSubmitting={isSubmitting} />
    </div>
  );
};

export default Checkout;
