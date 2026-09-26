import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAdminNotificationSummary } from "@/hooks/queries/useAdminNotifications";
import { supabase } from "@/integrations/supabase/client";
import { approveProduct, rejectProduct } from "@/features/admin/adminProductsApi";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminCancellationRequestsPanel from "@/components/admin/AdminCancellationRequestsPanel";
import AdminProductDeletionsPanel from "@/components/admin/AdminProductDeletionsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Search,
  Check,
  X,
  MapPin,
  Calendar,
  User,
  Package,
  Tag,
  FileText,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

interface PendingProduct {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  daily_price_owner: number;
  location_city: string | null;
  location_country: string | null;
  pickup_address: string | null;
  images: string[] | null;
  included_items: string[] | null;
  is_active: boolean;
  admin_flagged: boolean;
  flag_reason: string | null;
  owner_id: string;
  owner_name: string;
  slug: string | null;
  created_at: string;
  approval_status: string;
}

const AdminApprovals = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [imageIndices, setImageIndices] = useState<Record<string, number>>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab =
    tabParam === "cancellations" ? "cancellations" : tabParam === "deletions" ? "deletions" : "products";
  const { data: notifSummary } = useAdminNotificationSummary();
  const pendingProductsCount = Number(notifSummary?.pending_products || 0);
  const pendingCancellationsCount = Number(notifSummary?.pending_cancellations || 0);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-pending-products", searchQuery],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_pending_products", {
        search_query: searchQuery || null,
      });
      if (error) throw new Error(error.message);
      return (data || []) as PendingProduct[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: approveProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-products"] });
      toast({ title: "Anunț aprobat cu succes" });
    },
    onError: (err: Error) => {
      toast({ title: "Eroare", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectProduct(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-products"] });
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedProductId(null);
      toast({ title: "Anunț respins" });
    },
    onError: (err: Error) => {
      toast({ title: "Eroare", description: err.message, variant: "destructive" });
    },
  });

  const handleRejectClick = (productId: string) => {
    setSelectedProductId(productId);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedProductId || !rejectReason.trim()) return;
    rejectMutation.mutate({ id: selectedProductId, reason: rejectReason });
  };

  const getImageIndex = (productId: string) => imageIndices[productId] || 0;

  const setImageIndex = (productId: string, index: number) => {
    setImageIndices((prev) => ({ ...prev, [productId]: index }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Confirmări / Anulări</h1>
        <Tabs value={activeTab} onValueChange={(v) => setSearchParams((prev) => { const p = new URLSearchParams(prev); p.set("tab", v); return p; }, { replace: true })} className="space-y-4">
          <TabsList>
            <TabsTrigger value="products" className="gap-2">
              Anunțuri
              {pendingProductsCount > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-destructive-foreground">
                  {pendingProductsCount > 9 ? "9+" : pendingProductsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="cancellations" className="gap-2">
              Anulări rezervări
              {pendingCancellationsCount > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-destructive-foreground">
                  {pendingCancellationsCount > 9 ? "9+" : pendingCancellationsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="deletions" className="gap-2">
              Cereri ștergere
            </TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="space-y-6">


        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută după titlu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary" className="text-sm">
            {products.length} anunțuri în așteptare
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nu sunt anunțuri în așteptare pentru confirmare.
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="rounded-xl border border-border bg-card overflow-hidden">
            {products.map((product, index) => {
              const images = product.images || [];
              const currentIdx = getImageIndex(product.id);

              return (
                <AccordionItem
                  key={product.id}
                  value={product.id}
                  className={index > 0 ? "border-t border-border" : "border-b-0"}
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>svg]:hidden">
                    <div className="flex flex-1 items-center gap-3 min-w-0 text-left">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {images.length > 0 ? (
                          <img
                            src={images[0]}
                            alt={product.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-foreground">
                          {product.title}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate">{product.owner_name}</span>
                          <span className="mx-0.5">•</span>
                          <Calendar className="h-3 w-3" />
                          <span className="shrink-0">
                            {format(new Date(product.created_at), "dd MMM yyyy, HH:mm", { locale: ro })}
                          </span>
                        </div>
                      </div>
                      {product.category && (
                        <Badge variant="secondary" className="hidden md:inline-flex shrink-0">
                          {product.category}
                        </Badge>
                      )}
                      {images.length > 0 && (
                        <span className="hidden lg:inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <ImageIcon className="h-3.5 w-3.5" />
                          {images.length}
                        </span>
                      )}
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-primary">
                          {product.daily_price_owner} RON
                        </div>
                        <div className="text-[10px] text-muted-foreground">/ zi</div>
                      </div>
                      <span className="shrink-0 text-muted-foreground">
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pt-0">
                    <div className="grid md:grid-cols-[400px_1fr] gap-0 border-t border-border">
                      {/* Images */}
                      <div className="relative bg-muted aspect-square md:aspect-auto md:min-h-[320px]">
                        {images.length > 0 ? (
                          <>
                            <img
                              src={images[currentIdx]}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                            {images.length > 1 && (
                              <>
                                <button
                                  onClick={() =>
                                    setImageIndex(
                                      product.id,
                                      (currentIdx - 1 + images.length) % images.length
                                    )
                                  }
                                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1 hover:bg-background"
                                >
                                  <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() =>
                                    setImageIndex(
                                      product.id,
                                      (currentIdx + 1) % images.length
                                    )
                                  }
                                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1 hover:bg-background"
                                >
                                  <ChevronRight className="h-5 w-5" />
                                </button>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                  {images.map((_, i) => (
                                    <div
                                      key={i}
                                      className={`w-2 h-2 rounded-full ${
                                        i === currentIdx
                                          ? "bg-primary"
                                          : "bg-background/60"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                            <div className="absolute top-2 right-2">
                              <Badge variant="outline" className="bg-background/80">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                {images.length} imagini
                              </Badge>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-12 w-12" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-foreground">
                              {product.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>{product.owner_name}</span>
                              <span className="mx-1">•</span>
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(new Date(product.created_at), "dd MMM yyyy, HH:mm", {
                                  locale: ro,
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-2xl font-bold text-primary">
                              {product.daily_price_owner} RON
                            </div>
                            <div className="text-xs text-muted-foreground">/ zi</div>
                          </div>
                        </div>

                        {/* Category */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          {product.category && (
                            <Badge variant="secondary">{product.category}</Badge>
                          )}
                          {product.subcategory && (
                            <Badge variant="outline">{product.subcategory}</Badge>
                          )}
                        </div>

                        {/* Description */}
                        {product.description && (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">
                                Descriere
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {product.description}
                            </p>
                          </div>
                        )}

                        {/* Included items */}
                        {product.included_items && product.included_items.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">
                                Ce este inclus
                              </span>
                            </div>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {product.included_items.map((item, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <Check className="h-3 w-3 text-emerald-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Location */}
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="text-sm text-muted-foreground">
                            <div>
                              {[product.location_city, product.location_country]
                                .filter(Boolean)
                                .join(", ") || "Nedefinit"}
                            </div>
                            {product.pickup_address && (
                              <div className="mt-0.5">
                                Adresa ridicare: {product.pickup_address}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2 border-t border-border">
                          <Button
                            asChild
                            variant="outline"
                            className="gap-2"
                          >
                            <a
                              href={`/produs/${product.slug ?? product.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="h-4 w-4" />
                              Previzualizează anunț
                            </a>
                          </Button>
                          <Button
                            onClick={() => approveMutation.mutate(product.id)}
                            disabled={approveMutation.isPending}
                            className="gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Aprobă
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleRejectClick(product.id)}
                            disabled={rejectMutation.isPending}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Respinge
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
          </TabsContent>
          <TabsContent value="cancellations">
            <AdminCancellationRequestsPanel />
          </TabsContent>
          <TabsContent value="deletions">
            <AdminProductDeletionsPanel />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respinge anunțul</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Motivul respingerii..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Anulează
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              Respinge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminApprovals;
