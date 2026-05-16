import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Clock, MessageCircle, ArrowRight, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUxCopy } from "@/hooks/useUxCopy";
import { getOrCreateRentalConversation } from "@/features/messaging/messagingApi";
import { toast } from "sonner";

interface BookingConfirmationProps {
  productTitle: string;
  ownerName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  rentalDays: number;
  productId: string;
  ownerId: string;
  rentalId: string;
}

const BookingConfirmation = ({
  productTitle, ownerName, startDate, endDate, totalPrice, rentalDays, productId, ownerId, rentalId,
}: BookingConfirmationProps) => {
  const copy = useUxCopy();
  const navigate = useNavigate();
  const [isOpeningChat, setIsOpeningChat] = useState(false);

  const handleOpenChat = async () => {
    setIsOpeningChat(true);
    try {
      const conversationId = await getOrCreateRentalConversation(rentalId);
      if (conversationId) {
        navigate(`/mesaje?conv=${conversationId}`, {
          state: { returnTo: { pathname: window.location.pathname, search: window.location.search } },
        });
      } else {
        toast.error("Nu s-a putut deschide conversația.");
      }
    } catch {
      toast.error("Eroare la deschiderea conversației.");
    } finally {
      setIsOpeningChat(false);
    }
  };

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

      <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-md animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <Button variant="outline" className="flex-1" asChild>
          <Link to="/rezervari">
            <Search className="mr-2 h-4 w-4" />
            {copy.checkout.viewRequest}
          </Link>
        </Button>
        <Button className="flex-1" onClick={handleOpenChat} disabled={isOpeningChat}>
          <MessageCircle className="mr-2 h-4 w-4" />
          {isOpeningChat ? "Se deschide..." : "Discută cu proprietarul"}
        </Button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
