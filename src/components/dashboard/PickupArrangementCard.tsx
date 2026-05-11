import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, MapPin, MessageCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { proposePickup, confirmPickupArrangement } from "@/features/rentals/ownerRentalsApi";
import { getOrCreateRentalConversation } from "@/features/messaging/messagingApi";

interface Props {
  rentalId: string;
  ownerId: string | null;
  renterId?: string | null;
}

interface PickupProposalShape {
  proposed_by?: "owner" | "renter";
  time?: string;
  place?: string;
  owner_confirmed_at?: string | null;
  renter_confirmed_at?: string | null;
}

export default function PickupArrangementCard({ rentalId, ownerId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["pickup-proposal", rentalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rentals" as any)
        .select("pickup_proposal, pickup_agreed_at, owner_id, renter_id")
        .eq("id", rentalId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    refetchInterval: 8000,
  });

  const proposal: PickupProposalShape = (data?.pickup_proposal as any) || {};
  const isOwner = user?.id === ownerId;
  const myConfirmKey = isOwner ? "owner_confirmed_at" : "renter_confirmed_at";
  const otherConfirmKey = isOwner ? "renter_confirmed_at" : "owner_confirmed_at";
  const myConfirmed = !!proposal[myConfirmKey] && proposal[myConfirmKey] !== "null";
  const otherConfirmed = !!proposal[otherConfirmKey] && proposal[otherConfirmKey] !== "null";
  const agreed = !!data?.pickup_agreed_at;

  const proposeMutation = useMutation({
    mutationFn: () => proposePickup(rentalId, new Date(time).toISOString(), place.trim()),
    onSuccess: () => {
      toast.success("Propunere trimisă. Așteptăm confirmarea celeilalte părți.");
      qc.invalidateQueries({ queryKey: ["pickup-proposal", rentalId] });
    },
    onError: (e: any) => toast.error(e?.message || "Eroare la trimiterea propunerii"),
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirmPickupArrangement(rentalId),
    onSuccess: () => {
      toast.success("Predarea a fost confirmată!");
      qc.invalidateQueries({ queryKey: ["pickup-proposal", rentalId] });
      qc.invalidateQueries({ queryKey: ["my-rentals"] });
      qc.invalidateQueries({ queryKey: ["owner-rentals"] });
    },
    onError: (e: any) => toast.error(e?.message || "Eroare la confirmare"),
  });

  const handleChat = async () => {
    const convId = await getOrCreateRentalConversation(rentalId);
    if (convId) navigate(`/mesaje?conv=${convId}`);
  };

  if (isLoading) return null;
  if (agreed) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-emerald-900">Predare confirmată</p>
            {proposal.time && (
              <p className="text-emerald-800/80 mt-0.5">
                {format(new Date(proposal.time), "dd MMM yyyy · HH:mm")}
                {proposal.place ? ` · ${proposal.place}` : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No proposal yet → show form for either party.
  if (!proposal.time) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 sm:p-4 space-y-3 animate-fade-in">
        <div className="flex items-start gap-2">
          <CalendarClock className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-primary/80">Pas obligatoriu</p>
            <h4 className="font-heading text-base font-semibold text-foreground">Stabiliți predarea produsului</h4>
            <p className="text-sm text-muted-foreground mt-0.5">
              Înainte de a continua trebuie să confirmați amândoi locul și ora exactă a predării.
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Data și ora</Label>
            <Input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Locul predării</Label>
            <Input placeholder="Ex: Strada Victoriei 12, București" value={place} onChange={(e) => setPlace(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={!time || place.trim().length < 3 || proposeMutation.isPending}
            onClick={() => proposeMutation.mutate()}
          >
            {proposeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
            Propune predarea
          </Button>
          <Button variant="outline" size="sm" onClick={handleChat}>
            <MessageCircle className="h-4 w-4 mr-1" />
            Discută în chat
          </Button>
        </div>
      </div>
    );
  }

  // Proposal exists → show summary + confirm CTA for the other party.
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 sm:p-4 space-y-3 animate-fade-in">
      <div className="flex items-start gap-2">
        <CalendarClock className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-primary/80">
            {myConfirmed ? "În așteptarea celeilalte părți" : "Confirmare necesară"}
          </p>
          <h4 className="font-heading text-base font-semibold text-foreground">
            {format(new Date(proposal.time), "dd MMM yyyy · HH:mm")}
          </h4>
          {proposal.place && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
              {proposal.place}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {!myConfirmed && (
          <Button size="sm" onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending}>
            {confirmMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
            Confirm predarea
          </Button>
        )}
        {myConfirmed && !otherConfirmed && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Așteptăm confirmarea celeilalte părți
          </span>
        )}
        <Button variant="outline" size="sm" onClick={handleChat}>
          <MessageCircle className="h-4 w-4 mr-1" />
          Discută în chat
        </Button>
      </div>
    </div>
  );
}