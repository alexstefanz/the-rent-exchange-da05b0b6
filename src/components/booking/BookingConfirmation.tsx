import { Link } from "react-router-dom";
import { CheckCircle, Clock, MessageCircle, ArrowRight, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUxCopy } from "@/hooks/useUxCopy";

interface BookingConfirmationProps {
  productTitle: string;
  ownerName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  rentalDays: number;
}

const BookingConfirmation = ({
  productTitle, ownerName, startDate, endDate, totalPrice, rentalDays,
}: BookingConfirmationProps) => {
  const copy = useUxCopy();

  const steps = [
    { icon: MessageCircle, title: copy.checkout.requestSent, description: copy.checkout.requestSentDesc, completed: true },
    { icon: Clock, title: copy.checkout.waitingResponse, description: copy.checkout.waitingResponseDesc(ownerName), completed: false, current: true },
    { icon: CheckCircle, title: copy.checkout.confirmationStep, description: copy.checkout.confirmationDesc, completed: false },
  ];

  return (
    <div className="flex flex-col items-center text-center py-8 px-4">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 animate-fade-up">
        <CheckCircle className="h-12 w-12 text-emerald-600" />
      </div>

      <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl animate-fade-up" style={{ animationDelay: "0.1s" }}>
        {copy.booking.confirmation}
      </h1>

      <p className="mt-2 text-muted-foreground animate-fade-up" style={{ animationDelay: "0.15s" }}>
        {copy.checkout.sentTo} <span className="font-medium text-foreground">{productTitle}</span>
      </p>

      <div className="mt-6 w-full max-w-md rounded-xl border border-border bg-card p-4 animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-left">
            <span className="text-muted-foreground">{copy.checkout.periodLabel}:</span>
            <p className="font-medium text-foreground">{startDate} - {endDate}</p>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground">{copy.checkout.durationLabel}:</span>
            <p className="font-medium text-foreground">{rentalDays} {copy.checkout.days}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border flex justify-between">
          <span className="text-muted-foreground">{copy.checkout.totalLabel}:</span>
          <span className="font-bold text-primary">{totalPrice} RON</span>
        </div>
      </div>

      <div className="mt-8 w-full max-w-md animate-fade-up" style={{ animationDelay: "0.25s" }}>
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">
          {copy.booking.whatNext}
        </h3>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className={`flex items-start gap-4 rounded-lg p-3 ${step.current ? "bg-primary/5 border border-primary/20" : ""}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${step.completed ? "bg-emerald-100 text-emerald-600" : step.current ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h4 className={`font-medium ${step.current ? "text-primary" : "text-foreground"}`}>{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-md animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <Button variant="outline" className="flex-1" asChild>
          <Link to="/profil#mesaje">
            <MessageCircle className="mr-2 h-4 w-4" />
            {copy.checkout.viewRequest}
          </Link>
        </Button>
        <Button className="flex-1" asChild>
          <Link to="/cauta">
            <Search className="mr-2 h-4 w-4" />
            {copy.checkout.continueSearching}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
