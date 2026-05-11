import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { respondEarlyReturn } from "@/features/rentals/ownerRentalsApi";

interface Props {
  rentalId: string;
  productTitle: string;
}

/**
 * Owner-facing card. Renders only when the renter has requested
 * an early return (early_return_status = 'pending').
 */
export default function EarlyReturnResponseCard({ rentalId, productTitle }: Props) {
  const queryClient = useQueryClient();
  const [proposed, setProposed] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [submitting, setSubmitting] = useState<"accept" | "reject" | null>(null);

  const { data: rental } = useQuery({
    queryKey: ["earlyReturn", rentalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rentals")
        .select(
          "early_return_status, early_return_requested_at, early_return_reason, daily_price, end_date"
        )
        .eq("id", rentalId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 30_000,
  });

  if (!rental || rental.early_return_status !== "pending") return null;

  const handle = async (action: "accept" | "reject") => {
    setSubmitting(action);
    try {
      const opts: { proposedRefundAmount?: number; response?: string } = {
        response: response || undefined,
      };
      if (action === "accept" && proposed) {
        const n = Number(proposed);
        if (Number.isFinite(n) && n >= 0) opts.proposedRefundAmount = n;
      }
      await respondEarlyReturn(rentalId, action, opts);
      toast.success(
        action === "accept"
          ? "Ai acceptat returnarea anticipată. Continuați cu PV-ul de retur."
          : "Ai refuzat cererea. Rezervarea continuă normal."
      );
      queryClient.invalidateQueries({ queryKey: ["ownerRentals"] });
      queryClient.invalidateQueries({ queryKey: ["earlyReturn", rentalId] });
    } catch (e: any) {
      toast.error(e?.message || "A apărut o eroare");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Card className="mt-3 border-l-4 border-l-amber-500 bg-amber-50/40 dark:bg-amber-500/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <h4 className="font-semibold text-foreground text-sm">
            Cerere de returnare anticipată
          </h4>
          <Badge variant="secondary">În așteptare</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Chiriașul dorește să returneze produsul „{productTitle}” mai devreme.
        </p>
        {rental.early_return_reason && (
          <div className="rounded-md bg-background border border-border p-2 text-sm">
            <span className="text-muted-foreground">Motiv: </span>
            <span className="text-foreground">{rental.early_return_reason}</span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`refund-${rentalId}`} className="text-xs">
              Sumă propusă pentru rambursare (RON, opțional)
            </Label>
            <Input
              id={`refund-${rentalId}`}
              type="number"
              min={0}
              step="0.01"
              placeholder="0"
              value={proposed}
              onChange={(e) => setProposed(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Lasă gol dacă nu oferi rambursare suplimentară.
            </p>
          </div>
          <div>
            <Label htmlFor={`note-${rentalId}`} className="text-xs">
              Mesaj pentru chiriaș (opțional)
            </Label>
            <Textarea
              id={`note-${rentalId}`}
              rows={2}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Ex: ne vedem mâine la 10:00 pentru retur"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            onClick={() => handle("accept")}
            disabled={submitting !== null}
          >
            {submitting === "accept" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            Acceptă returnarea
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handle("reject")}
            disabled={submitting !== null}
          >
            {submitting === "reject" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <X className="h-4 w-4 mr-1" />
            )}
            Refuză
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Dacă accepți, rezervarea continuă cu procesul verbal de returnare. Dacă
          refuzi, închirierea continuă conform planului inițial.
        </p>
      </CardContent>
    </Card>
  );
}