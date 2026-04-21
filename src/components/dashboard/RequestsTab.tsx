import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Search, XCircle, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrCreateConversation } from "@/features/messaging/messagingApi";
import StatusBadge from "./StatusBadge";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { toast } from "sonner";
import RentalTimeline from "./RentalTimeline";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Request {
  id: string;
  product_id: string | null;
  product_title: string;
  product_image: string;
  owner_id: string | null;
  owner_name: string;
  start_date: string;
  end_date: string;
  end_date_raw: string;
  subtotal: number;
  status: string;
  payment_status?: string;
  handover_confirmed_at?: string | null;
  return_confirmed_at?: string | null;
  refunded_at?: string | null;
  location: string;
  created_at: string;
}

const fetchMyRequests = async (userId: string): Promise<Request[]> => {
  const { data, error } = await supabase
    .from("rentals")
    .select("id, product_id, start_date, end_date, subtotal, status, payment_status, handover_confirmed_at, return_confirmed_at, refunded_at, created_at, products(title, images, location_city, owner_id, profiles:owner_id(full_name))")
    .eq("renter_id", userId)
    .in("status", ["pending", "cancelled"])
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    product_id: r.product_id,
    product_title: r.products?.title || "Produs șters",
    product_image: r.products?.images?.[0] || "/placeholder.svg",
    owner_id: r.products?.owner_id || null,
    owner_name: r.products?.profiles?.full_name || "Utilizator",
    start_date: format(new Date(r.start_date), "dd MMM yyyy"),
    end_date: format(new Date(r.end_date), "dd MMM yyyy"),
    end_date_raw: r.end_date,
    subtotal: r.subtotal,
    status: r.status,
    payment_status: r.payment_status,
    handover_confirmed_at: r.handover_confirmed_at,
    return_confirmed_at: r.return_confirmed_at,
    refunded_at: r.refunded_at,
    location: r.products?.location_city || "",
    created_at: r.created_at,
  }));
};

const canCancel = (request: Request) =>
  request.status === "pending" && differenceInHours(new Date(), new Date(request.created_at)) < 24;

const RequestsTab = () => {
  const copy = useUxCopy();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleContactOwner = async (request: Request) => {
    if (!request.product_id || !request.owner_id) return;
    const conv = await getOrCreateConversation(request.product_id, request.owner_id);
    if (conv) {
      navigate(`/mesaje?conv=${conv.id}`);
    }
  };

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["my-requests", user?.id],
    queryFn: () => fetchMyRequests(user!.id),
    enabled: !!user?.id,
  });

  const cancelMutation = useMutation({
    mutationFn: async (request: Request) => {
      const { error } = await supabase
        .from("rentals")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", request.id);
      if (error) throw error;
      // Notification to owner is handled server-side by the edge function below
    },
    onSuccess: (_data, request) => {
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["pending-requests-count"] });
      toast.success("Cererea a fost anulată cu succes");

      // Send cancellation email notification (non-blocking)
      supabase.functions.invoke('send-cancellation-notification', {
        body: { rental_id: request.id },
      }).catch((e) => console.error('Cancellation notification error:', e));
    },
    onError: () => {
      toast.error("Eroare la anularea cererii");
    },
  });

  const pendingRequests = requests.filter(r => r.status === "pending");
  const cancelledRequests = requests.filter(r => r.status === "cancelled");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ClipboardList className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-heading text-xl font-semibold text-foreground">
          {copy.dashboard.noRentals}
        </h3>
        <p className="mb-6 max-w-md text-muted-foreground">
          Nu ai nicio cerere de închiriere momentan.
        </p>
        <Button asChild>
          <Link to="/cauta">
            <Search className="mr-2 h-4 w-4" />
            {copy.dashboard.startSearching}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {pendingRequests.length > 0 && (
        <section>
          <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">Cereri în așteptare</h3>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
                <img src={request.product_image} alt={request.product_title} className="w-full sm:w-24 h-32 sm:h-24 rounded-lg object-contain bg-white" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/produs/${request.product_id}`} className="font-medium text-foreground hover:text-primary transition-colors">{request.product_title}</Link>
                    <StatusBadge status={request.status as any} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{copy.dashboard.owner}: {request.owner_name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{request.start_date} - {request.end_date}</span>
                    {request.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{request.location}</span>}
                  </div>
                  <div className="mt-3">
                    <span className="text-lg font-bold text-primary">{request.subtotal} RON</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <RentalTimeline rental={{
                      status: request.status,
                      payment_status: request.payment_status,
                      end_date: request.end_date_raw,
                      handover_confirmed_at: request.handover_confirmed_at,
                      return_confirmed_at: request.return_confirmed_at,
                      refunded_at: request.refunded_at,
                    }} />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    {canCancel(request) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" disabled={cancelMutation.isPending}>
                            <XCircle className="mr-1 h-3 w-3" />
                            Anulează
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Anulează cererea</AlertDialogTitle>
                            <AlertDialogDescription>
                              Ești sigur că vrei să anulezi cererea de închiriere pentru <strong>{request.product_title}</strong>? Această acțiune nu poate fi anulată.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Înapoi</AlertDialogCancel>
                            <AlertDialogAction onClick={() => cancelMutation.mutate(request)}>
                              Da, anulează
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleContactOwner(request)}>
                      {copy.dashboard.contactOwner}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {cancelledRequests.length > 0 && (
        <section>
          <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">Cereri anulate</h3>
          <div className="space-y-4">
            {cancelledRequests.map((request) => (
              <div key={request.id} className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4 opacity-75">
                <img src={request.product_image} alt={request.product_title} className="w-full sm:w-24 h-32 sm:h-24 rounded-lg object-contain bg-white" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-foreground">{request.product_title}</span>
                    <StatusBadge status={request.status as any} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{request.start_date} - {request.end_date}</span>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-lg font-bold text-muted-foreground">{request.subtotal} RON</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <RentalTimeline rental={{
                      status: request.status,
                      payment_status: request.payment_status,
                      end_date: request.end_date_raw,
                      refunded_at: request.refunded_at,
                    }} />
                    {request.refunded_at && (
                      <p className="mt-2 text-xs text-destructive font-medium text-center">
                        💸 Banii au fost returnați
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default RequestsTab;
