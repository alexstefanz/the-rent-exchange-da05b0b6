import { getOrCreateRentalConversation } from "@/features/messaging/messagingApi";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, Calendar, Hash, Banknote, MessageCircle, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import type { OwnerRental } from "@/features/rentals/ownerRentalsApi";
import { useLanguage } from "@/contexts/LanguageContext";

interface AcceptedRentalDialogProps {
  rental: OwnerRental | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelled?: () => void;
}

export function AcceptedRentalDialog({ rental, open, onOpenChange, onCancelled }: AcceptedRentalDialogProps) {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const dateLocale = language === "ro" ? ro : enUS;
  const [startingChat, setStartingChat] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (!rental) return null;

  const isWithin24h = rental.created_at
    ? Date.now() - new Date(rental.created_at).getTime() < 24 * 60 * 60 * 1000
    : false;

  const bookingNumber = rental.id.slice(0, 8).toUpperCase();

  const handleStartChat = async () => {
    if (!rental.renter_id || !rental.product_id) return;
    setStartingChat(true);
    try {
      // Find existing conversation for this product where the renter is the buyer
      const convId = await getOrCreateRentalConversation(rental.id);
      const existing = convId ? { id: convId } : null;

      onOpenChange(false);
      const returnTo = { pathname: window.location.pathname, search: window.location.search };
      if (existing) {
        navigate(`/mesaje?conv=${existing.id}`, { state: { returnTo } });
      } else {
        navigate("/mesaje");
      }
    } catch (e) {
      console.error(e);
      toast.error(t("Eroare la deschiderea chat-ului", "Error opening chat"));
    } finally {
      setStartingChat(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { error } = await supabase
        .from("rentals")
        .update({
          status: "cancelled",
          cancellation_reason: language === "ro" ? "Anulat de proprietar" : "Cancelled by owner",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", rental.id);

      if (error) throw error;
      toast.success(t("Cererea a fost anulată", "The request was cancelled"));
      onOpenChange(false);
      onCancelled?.();
    } catch (e) {
      console.error(e);
      toast.error(t("Eroare la anularea cererii", "Error cancelling the request"));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{t("Cerere acceptată!", "Request accepted!")} ✅</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            {/* Renter info */}
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-16 w-16">
                <AvatarImage src={rental.renter_avatar || undefined} />
                <AvatarFallback className="text-lg">
                  {rental.renter_name?.charAt(0) || "C"}
                </AvatarFallback>
              </Avatar>
              <Link
                to={`/utilizator/${rental.renter_id}`}
                className="font-semibold text-foreground hover:underline"
              >
                {rental.renter_name || t("Chiriaș", "Renter")}
              </Link>
            </div>

            {/* Booking info cards */}
            <div className="grid grid-cols-3 gap-3 w-full">
              <div className="rounded-xl border border-border bg-muted/50 p-3 text-center">
                <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">{t("Perioadă", "Period")}</p>
                <p className="text-sm font-medium">
                  {format(new Date(rental.start_date), "d MMM", { locale: dateLocale })} -{" "}
                  {format(new Date(rental.end_date), "d MMM", { locale: dateLocale })}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/50 p-3 text-center">
                <Hash className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">{t("Booking nr.", "Booking no.")}</p>
                <p className="text-sm font-medium font-mono">{bookingNumber}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/50 p-3 text-center">
                <Banknote className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">{t("Total", "Total")}</p>
                <p className="text-sm font-semibold text-primary">{rental.subtotal} RON</p>
              </div>
            </div>

            {/* Chat button */}
            <Button className="w-full" onClick={handleStartChat} disabled={startingChat}>
              {startingChat ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MessageCircle className="h-4 w-4 mr-2" />
              )}
              {t("Discută cu chiriașul", "Chat with renter")}
            </Button>

            {/* Cancel button - only within 24h */}
            {isWithin24h && (
              <div className="w-full space-y-1">
                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  {t("Anulează cererea *", "Cancel request *")}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t("*Anularea este posibilă doar în primele 24 de ore", "*Cancellation is only possible within the first 24 hours")}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
