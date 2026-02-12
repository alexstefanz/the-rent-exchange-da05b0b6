import { useState } from "react";
import { Link } from "react-router-dom";
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
import { ro } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChatDialog } from "@/components/messaging/ChatDialog";
import type { OwnerRental } from "@/features/rentals/ownerRentalsApi";

interface AcceptedRentalDialogProps {
  rental: OwnerRental | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelled?: () => void;
}

export function AcceptedRentalDialog({ rental, open, onOpenChange, onCancelled }: AcceptedRentalDialogProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatConversationId, setChatConversationId] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { data: kycApproved } = useQuery({
    queryKey: ["renterKyc", rental?.renter_id],
    queryFn: async () => {
      if (!rental?.renter_id) return false;
      const { data } = await supabase
        .from("kyc_verifications")
        .select("status")
        .eq("user_id", rental.renter_id)
        .eq("status", "approved")
        .maybeSingle();
      return !!data;
    },
    enabled: !!rental?.renter_id && open,
  });

  if (!rental) return null;

  const isWithin24h = rental.created_at
    ? Date.now() - new Date(rental.created_at).getTime() < 24 * 60 * 60 * 1000
    : false;

  const bookingNumber = rental.id.slice(0, 8).toUpperCase();

  const handleStartChat = async () => {
    if (!rental.renter_id || !rental.product_id) return;
    setStartingChat(true);
    try {
      // Check if conversation already exists (owner or buyer perspective)
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("product_id", rental.product_id)
        .or(`buyer_id.eq.${rental.renter_id},owner_id.eq.${rental.renter_id}`)
        .maybeSingle();

      if (existing) {
        setChatConversationId(existing.id);
        setChatOpen(true);
      } else {
        // Navigate to messages page since owner can't create conversation (RLS: buyer_id must match auth.uid)
        window.location.href = "/mesaje";
      }
    } catch (e) {
      console.error(e);
      toast.error("Eroare la deschiderea chat-ului");
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
          cancellation_reason: "Anulat de proprietar",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", rental.id);

      if (error) throw error;
      toast.success("Cererea a fost anulată");
      onOpenChange(false);
      onCancelled?.();
    } catch (e) {
      console.error(e);
      toast.error("Eroare la anularea cererii");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Cerere acceptată! ✅</DialogTitle>
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
                to={`/user/${rental.renter_id}`}
                className="font-semibold text-foreground hover:underline"
              >
                {rental.renter_name || "Chiriaș"}
              </Link>
              {kycApproved && (
                <Badge variant="outline" className="gap-1 border-emerald-500/50 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verificat ID
                </Badge>
              )}
            </div>

            {/* Booking info cards */}
            <div className="grid grid-cols-3 gap-3 w-full">
              <div className="rounded-xl border border-border bg-muted/50 p-3 text-center">
                <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Perioadă</p>
                <p className="text-sm font-medium">
                  {format(new Date(rental.start_date), "d MMM", { locale: ro })} -{" "}
                  {format(new Date(rental.end_date), "d MMM", { locale: ro })}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/50 p-3 text-center">
                <Hash className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Booking nr.</p>
                <p className="text-sm font-medium font-mono">{bookingNumber}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/50 p-3 text-center">
                <Banknote className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Total</p>
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
              Discută cu chiriașul
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
                  Cancel request *
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  *Anularea este posibilă doar în primele 24 de ore
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      {chatConversationId && (
        <ChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          conversationId={chatConversationId}
          otherUserName={rental.renter_name}
          otherUserAvatar={rental.renter_avatar}
          productTitle={rental.product_title}
        />
      )}
    </>
  );
}
