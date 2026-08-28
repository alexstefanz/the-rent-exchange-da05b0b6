import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Check, X, ImageIcon, User, Calendar, MapPin, Eye } from "lucide-react";

interface PendingDeletion {
  id: string;
  title: string;
  category: string | null;
  daily_price_owner: number;
  location_city: string | null;
  images: string[] | null;
  slug: string | null;
  owner_id: string;
  owner_name: string;
  approval_status: string;
  created_at: string;
  deletion_requested_at: string;
}

const AdminProductDeletionsPanel = () => {
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-pending-deletions"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_admin_pending_deletions");
      if (error) throw new Error(error.message);
      return (data || []) as PendingDeletion[];
    },
  });

  const run = (fn: string, okMsg: string) =>
    useMutation;

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.rpc as any)("admin_confirm_product_deletion", { _id: id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-pending-deletions"] });
      toast({ title: "Anunț șters definitiv" });
    },
    onError: (e: Error) => toast({ title: "Eroare", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.rpc as any)("admin_reject_product_deletion", { _id: id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-pending-deletions"] });
      toast({ title: "Cerere de ștergere respinsă" });
    },
    onError: (e: Error) => toast({ title: "Eroare", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nu sunt cereri de ștergere în așteptare.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((p) => (
        <Card key={p.id} className="overflow-hidden">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
              {p.images?.[0] ? (
                <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="truncate font-semibold text-foreground">{p.title}</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{p.owner_name}</span>
                {p.location_city && (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location_city}</span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Cerere: {format(new Date(p.deletion_requested_at), "dd MMM yyyy, HH:mm", { locale: ro })}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {p.category && <Badge variant="secondary">{p.category}</Badge>}
                <Badge variant="outline">{p.daily_price_owner} RON / zi</Badge>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <a href={`/produs/${p.slug ?? p.id}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4" /> Vezi
                </a>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                disabled={confirmMutation.isPending}
                onClick={() => confirmMutation.mutate(p.id)}
              >
                <Check className="h-4 w-4" /> Confirmă ștergerea
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate(p.id)}
              >
                <X className="h-4 w-4" /> Respinge
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminProductDeletionsPanel;
