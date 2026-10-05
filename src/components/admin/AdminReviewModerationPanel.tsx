import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Check, Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

type Kind = "product" | "user";

interface PendingReview {
  kind: Kind;
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  moderation_reason: string | null;
  reviewer_name: string;
  target_label: string;
  rental_code: string | null;
}

async function fetchPending(): Promise<PendingReview[]> {
  const [pr, ur] = await Promise.all([
    supabase
      .from("product_reviews")
      .select("id, rating, comment, created_at, moderation_reason, reviewer:reviewer_id(full_name), product:product_id(title), rental:rental_id(public_id)")
      .eq("status", "pending_review")
      .order("created_at", { ascending: true }),
    supabase
      .from("user_reviews")
      .select("id, rating, comment, created_at, moderation_reason, reviewer:reviewer_id(full_name), target:reviewed_user_id(full_name), rental:rental_id(public_id)")
      .eq("status", "pending_review")
      .order("created_at", { ascending: true }),
  ]);
  if (pr.error) throw pr.error;
  if (ur.error) throw ur.error;
  const a = (pr.data || []).map((r: any) => ({
    kind: "product" as const,
    id: r.id, rating: r.rating, comment: r.comment, created_at: r.created_at,
    moderation_reason: r.moderation_reason,
    reviewer_name: r.reviewer?.full_name || "—",
    target_label: `Produs: ${r.product?.title || "—"}`,
    rental_code: r.rental?.public_id || null,
  }));
  const b = (ur.data || []).map((r: any) => ({
    kind: "user" as const,
    id: r.id, rating: r.rating, comment: r.comment, created_at: r.created_at,
    moderation_reason: r.moderation_reason,
    reviewer_name: r.reviewer?.full_name || "—",
    target_label: `Utilizator: ${r.target?.full_name || "—"}`,
    rental_code: r.rental?.public_id || null,
  }));
  return [...a, ...b].sort((x, y) => x.created_at.localeCompare(y.created_at));
}

export function usePendingReviewsCount() {
  const { data } = useQuery({ queryKey: ["admin-pending-reviews"], queryFn: fetchPending });
  return data?.length || 0;
}

export default function AdminReviewModerationPanel() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-pending-reviews"], queryFn: fetchPending });
  const [rejecting, setRejecting] = useState<PendingReview | null>(null);
  const [note, setNote] = useState("");

  const moderate = useMutation({
    mutationFn: async (v: { r: PendingReview; approve: boolean; note?: string }) => {
      const { error } = await supabase.rpc("admin_moderate_review", {
        _table: v.r.kind, _id: v.r.id, _approve: v.approve, _note: v.note ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["admin-pending-reviews"] });
      setRejecting(null);
      setNote("");
      toast({ title: v.approve ? "Recenzie publicată" : "Recenzie respinsă" });
    },
    onError: (e: Error) => toast({ title: "Eroare", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }
  if (data.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">Nu există recenzii în așteptare.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((r) => (
        <Card key={`${r.kind}-${r.id}`}>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                {r.rating}<Star className="h-4 w-4 fill-primary text-primary" />
              </span>
              <Badge variant={r.moderation_reason === "dispute" ? "destructive" : "secondary"}>
                {r.moderation_reason === "dispute"
                  ? `Închiriere cu dispută${r.rental_code ? ` ${r.rental_code}` : ""}`
                  : `Notă ${r.rating}★`}
              </Badge>
              {r.rental_code && r.moderation_reason !== "dispute" && <Badge variant="outline">{r.rental_code}</Badge>}
              <span className="ml-auto text-xs text-muted-foreground">
                {format(new Date(r.created_at), "d MMM yyyy, HH:mm", { locale: ro })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              De la <span className="font-medium text-foreground">{r.reviewer_name}</span> · {r.target_label}
            </p>
            <p className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm text-foreground">
              {r.comment || <em className="text-muted-foreground">Fără comentariu</em>}
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => moderate.mutate({ r, approve: true })} disabled={moderate.isPending}>
                <Check className="mr-1 h-4 w-4" />Aprobă și publică
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRejecting(r)} disabled={moderate.isPending}>
                <X className="mr-1 h-4 w-4" />Respinge
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Respinge recenzia</DialogTitle></DialogHeader>
          <Textarea placeholder="Motiv intern (obligatoriu)" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Anulează</Button>
            <Button
              variant="destructive"
              disabled={!note.trim() || moderate.isPending}
              onClick={() => rejecting && moderate.mutate({ r: rejecting, approve: false, note: note.trim() })}
            >
              Respinge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
