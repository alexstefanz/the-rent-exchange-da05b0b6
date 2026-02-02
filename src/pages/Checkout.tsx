import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { ArrowLeft, ChevronDown, ChevronUp, Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import LoginDialog from "@/components/checkout/LoginDialog";
import PaymentMethodDialog from "@/components/checkout/PaymentMethodDialog";
import ProgressIndicator from "@/components/booking/ProgressIndicator";
import BookingConfirmation from "@/components/booking/BookingConfirmation";
import ReassuranceMessage from "@/components/trust/ReassuranceMessage";
import { uxCopy } from "@/data/uxCopy";

interface CheckoutState {
  product: {
    id: string;
    title: string;
    images: string[];
    price: number;
    priceUnit: string;
    location: string;
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

  const [paymentOption, setPaymentOption] = useState("pay-now");
  const [currentStep, setCurrentStep] = useState(1);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [messageToOwner, setMessageToOwner] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  // If no state, redirect back
  if (!state) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Nu există date de rezervare.</p>
          <Button onClick={() => navigate(-1)}>Înapoi</Button>
        </div>
      </div>
    );
  }

  const { product, startDate, endDate, rentalDays, totalPrice } = state;
  const payLaterDate = new Date(startDate);
  payLaterDate.setDate(payLaterDate.getDate() - 2);

  const handleNextStep1 = () => {
    if (!isLoggedIn) {
      setShowLoginDialog(true);
    } else {
      setCurrentStep(2);
    }
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLoginDialog(false);
    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    setCurrentStep(3);
  };

  const handleNextStep3 = () => {
    setShowPaymentDialog(true);
  };

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
    setShowPaymentDialog(false);
    setCurrentStep(4);
  };

  const handleConfirmReservation = () => {
    setIsConfirmed(true);
  };

  // Show confirmation screen
  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link to="/" className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-heading text-xl md:text-2xl font-semibold">Rezervare completă</h1>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-6">
          <BookingConfirmation
            productTitle={product.title}
            ownerName="Proprietar"
            startDate={format(new Date(startDate), "d MMM", { locale: ro })}
            endDate={format(new Date(endDate), "d MMM yyyy", { locale: ro })}
            totalPrice={totalPrice}
            rentalDays={rentalDays}
          />
        </main>
      </div>
    );
  }

  const steps = [
    uxCopy.booking.steps.period,
    uxCopy.booking.steps.message,
    "Plată",
    uxCopy.booking.steps.confirm,
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate(-1)}
            className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-heading text-xl md:text-2xl font-semibold">Confirmă și plătește</h1>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="border-b border-border bg-card/50 py-4">
        <div className="max-w-4xl mx-auto px-4">
          <ProgressIndicator currentStep={currentStep} steps={steps} totalSteps={4} />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Steps */}
          <div className="space-y-4">
            {/* Step 1: Choose when to pay */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setCurrentStep(1)}
                className={`w-full px-6 py-4 flex items-center justify-between text-left ${currentStep !== 1 && currentStep > 1 ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep > 1 ? 'bg-primary text-primary-foreground' : currentStep === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {currentStep > 1 ? '✓' : '1'}
                  </div>
                  <h2 className="font-semibold text-lg">Alege când plătești</h2>
                </div>
                {currentStep === 1 ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {currentStep === 1 && (
                <div className="px-6 pb-6">
                  <RadioGroup value={paymentOption} onValueChange={setPaymentOption} className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setPaymentOption("pay-now")}>
                      <RadioGroupItem value="pay-now" id="pay-now" className="mt-1" />
                      <Label htmlFor="pay-now" className="flex-1 cursor-pointer">
                        <div className="font-medium">Plătește {totalPrice} RON acum</div>
                      </Label>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setPaymentOption("pay-later")}>
                      <RadioGroupItem value="pay-later" id="pay-later" className="mt-1" />
                      <Label htmlFor="pay-later" className="flex-1 cursor-pointer">
                        <div className="font-medium">Plătește 0 RON acum</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {totalPrice} RON va fi debitat pe {format(payLaterDate, "d MMMM yyyy", { locale: ro })}. Fără taxe suplimentare.
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  <div className="flex justify-end mt-6">
                    <Button onClick={handleNextStep1} className="px-8">
                      {uxCopy.common.continue}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Message to owner */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => isLoggedIn && currentStep >= 2 && setCurrentStep(2)}
                className={`w-full px-6 py-4 flex items-center justify-between text-left ${currentStep < 2 ? 'opacity-60' : ''}`}
                disabled={currentStep < 2}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep > 2 ? 'bg-primary text-primary-foreground' : currentStep === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {currentStep > 2 ? '✓' : '2'}
                  </div>
                  <h2 className="font-semibold text-lg">Mesaj pentru proprietar</h2>
                </div>
                {currentStep === 2 && (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {currentStep === 2 && (
                <div className="px-6 pb-6">
                  <p className="text-muted-foreground text-sm mb-4">
                    Trimite un mesaj proprietarului pentru a te prezenta și a pune întrebări.
                  </p>
                  <Textarea
                    placeholder={uxCopy.booking.messagePlaceholder}
                    value={messageToOwner}
                    onChange={(e) => setMessageToOwner(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleNextStep2} className="px-8">
                      {uxCopy.common.continue}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Add payment method */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => currentStep >= 3 && setCurrentStep(3)}
                className={`w-full px-6 py-4 flex items-center justify-between text-left ${currentStep < 3 ? 'opacity-60' : ''}`}
                disabled={currentStep < 3}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep > 3 ? 'bg-primary text-primary-foreground' : currentStep === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {currentStep > 3 ? '✓' : '3'}
                  </div>
                  <h2 className="font-semibold text-lg">Metodă de plată</h2>
                  {paymentMethod && (
                    <span className="text-sm text-muted-foreground">
                      • {paymentMethod === 'card' ? 'Card' : paymentMethod === 'google-pay' ? 'Google Pay' : 'Apple Pay'}
                    </span>
                  )}
                </div>
                {currentStep === 3 && (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {currentStep === 3 && (
                <div className="px-6 pb-6">
                  <ReassuranceMessage type="payment" className="mb-4" />
                  <p className="text-muted-foreground text-sm mb-4">
                    Selectează metoda de plată preferată pentru a finaliza rezervarea.
                  </p>
                  <div className="flex justify-end">
                    <Button onClick={handleNextStep3} className="px-8">
                      Selectează metoda
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Review reservation */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => paymentMethod && setCurrentStep(4)}
                className={`w-full px-6 py-4 flex items-center justify-between text-left ${currentStep < 4 ? 'opacity-60' : ''}`}
                disabled={currentStep < 4}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 4 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    4
                  </div>
                  <h2 className="font-semibold text-lg">Verifică rezervarea</h2>
                </div>
                {currentStep === 4 && (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {currentStep === 4 && paymentMethod && (
                <div className="px-6 pb-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Produs</span>
                      <span className="font-medium">{product.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Perioadă</span>
                      <span className="font-medium">
                        {format(new Date(startDate), "d MMM", { locale: ro })} - {format(new Date(endDate), "d MMM yyyy", { locale: ro })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Durată</span>
                      <span className="font-medium">{rentalDays} zile</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Metodă plată</span>
                      <span className="font-medium">
                        {paymentMethod === 'card' ? 'Card bancar' : paymentMethod === 'google-pay' ? 'Google Pay' : 'Apple Pay'}
                      </span>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-base font-semibold">
                      <span>Total de plată</span>
                      <span className="text-primary">{totalPrice} RON</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-4">
                    Prin finalizarea rezervării, accepți <span className="text-primary hover:underline cursor-pointer">Termenii și Condițiile</span> și <span className="text-primary hover:underline cursor-pointer">Politica de Confidențialitate</span>.
                  </p>
                  
                  <Button 
                    onClick={handleConfirmReservation} 
                    className="w-full mt-4"
                    size="lg"
                  >
                    {uxCopy.booking.ctaPrimary}
                  </Button>

                  <p className="mt-3 text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                    <Info className="h-3 w-3" />
                    {uxCopy.booking.reassurance}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Product Summary */}
          <div className="lg:order-first">
            <div className="sticky top-6 bg-card rounded-xl border border-border p-6">
              <div className="flex gap-4">
                <img 
                  src={product.images[0]} 
                  alt={product.title}
                  className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{product.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{product.location}</p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <h4 className="font-semibold mb-3">{uxCopy.booking.priceBreakdown.subtotal}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {product.price} RON × {rentalDays} zile
                  </span>
                  <span>{totalPrice} RON</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{uxCopy.booking.priceBreakdown.serviceFee}</span>
                  <span>0 RON</span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between font-semibold">
                <span>{uxCopy.booking.priceBreakdown.total}</span>
                <span>{totalPrice} RON</span>
              </div>
              
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Check-in</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(startDate), "d MMMM yyyy", { locale: ro })}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground mt-1">
                  <span>Check-out</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(endDate), "d MMMM yyyy", { locale: ro })}
                  </span>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-primary" />
                <span>{uxCopy.booking.freeCancellation}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Login Dialog */}
      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Payment Method Dialog */}
      <PaymentMethodDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        onSelectMethod={handlePaymentMethodSelect}
      />
    </div>
  );
};

export default Checkout;
