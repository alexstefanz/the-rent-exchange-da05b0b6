import { usePageSeo } from "@/hooks/usePageSeo";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ArrowLeft, Plus, Package, Inbox, FileText, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMyProducts } from "@/hooks/queries/useProducts";
import { useOwnerListingsStats } from "@/hooks/queries/useOwnerListingsStats";
import ListingsFilterBar, { type ListingsFilters } from "@/components/listings/ListingsFilterBar";
import ListingCard from "@/components/listings/ListingCard";
import ListingsEmptyState from "@/components/listings/ListingsEmptyState";
import ListingAvailabilityDialog from "@/components/listings/ListingAvailabilityDialog";
import ListingHistoryDialog from "@/components/listings/ListingHistoryDialog";
import type { ListingStatus } from "@/components/listings/ListingStatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteProduct, cancelProductDeletionRequest, updateProduct, type Product } from "@/features/products/productsApi";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import RentalsOutTab from "@/components/dashboard/RentalsOutTab";
import { getActiveDraft, deleteDraft, type ProductDraft } from "@/features/publish/draftsApi";

const deriveStatus = (p: Product): ListingStatus => {
  if ((p as any).deletion_requested_at) return "deletion_pending";
  const a = (p as any).approval_status as string | undefined;
  if (a === "pending") return "pending";
  if (a === "rejected") return "rejected";
  if (!p.is_active) return "hidden";
  if (p.available_immediately === false) return "unavailable";
  return "active";
};

const ListingsPage = () => {
  usePageSeo({ title: "Anunțurile mele — Rentli", description: "Zona privată a contului tău Rentli.", noindex: true });
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const topTab = searchParams.get("tab") === "cereri" ? "cereri" : "anunturi";
  const setTopTab = (v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v === "cereri") next.set("tab", "cereri");
    else next.delete("tab");
    setSearchParams(next, { replace: true });
  };
  const qc = useQueryClient();
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const t = (ro: string, en: string) => (language === "ro" ? ro : en);

  const { data: products = [], isLoading } = useMyProducts(user?.id);
  const { data: stats } = useOwnerListingsStats(user?.id);

  const [filters, setFilters] = useState<ListingsFilters>({
    search: "", status: "all", category: "all", city: "all", sort: "recent",
  });

  const [availabilityProduct, setAvailabilityProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [confirmHide, setConfirmHide] = useState<Product | null>(null);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [confirmDeleteDraft, setConfirmDeleteDraft] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getActiveDraft(user.id, null).then((d) => {
      if (!d) return setDraft(null);
      const payload = (d.payload || {}) as any;
      const isEmpty = !payload?.title && !payload?.category && (!payload?.images || payload.images.length === 0);
      setDraft(isEmpty ? null : d);
    });
  }, [user?.id]);

  const handleDeleteDraft = async () => {
    if (!draft) return;
    try {
      await deleteDraft(draft.id);
      toast({ title: t("Draft șters", "Draft deleted") });
      setDraft(null);
    } catch {
      toast({ title: t("Eroare la ștergere", "Delete failed"), variant: "destructive" });
    }
    setConfirmDeleteDraft(false);
  };

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  // Realtime: refresh on any change to user's products
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`owner-listings-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `owner_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["my-products", user.id] });
          qc.invalidateQueries({ queryKey: ["owner-listings-stats", user.id] });
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "rentals", filter: `owner_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["owner-listings-stats", user.id] });
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, qc]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[])).sort(),
    [products],
  );

  const filtered = useMemo(() => {
    let list = [...products];
    const s = filters.search.trim().toLowerCase();
    if (s) list = list.filter((p) => p.title.toLowerCase().includes(s) || (p.title_en || "").toLowerCase().includes(s));
    if (filters.category !== "all") list = list.filter((p) => p.category === filters.category);
    if (filters.status !== "all") list = list.filter((p) => {
      const st = deriveStatus(p);
      if (filters.status === "active") return st === "active" || st === "unavailable";
      return st === filters.status;
    });
    switch (filters.sort) {
      case "price_asc": list.sort((a, b) => a.daily_price_owner - b.daily_price_owner); break;
      case "price_desc": list.sort((a, b) => b.daily_price_owner - a.daily_price_owner); break;
      case "title_asc": list.sort((a, b) => a.title.localeCompare(b.title)); break;
      default: list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }
    return list;
  }, [products, filters]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["my-products", user?.id] });
    qc.invalidateQueries({ queryKey: ["owner-listings-stats", user?.id] });
  };

  const handleHide = async (p: Product) => {
    if (!user) return;
    await updateProduct(p.id, { is_active: false }, user.id);
    toast({ title: t("Anunț ascuns", "Listing hidden") });
    refresh();
    setConfirmHide(null);
  };
  const handleActivate = async (p: Product) => {
    if (!user) return;
    await updateProduct(p.id, { is_active: true }, user.id);
    toast({ title: t("Anunț reactivat", "Listing reactivated") });
    refresh();
  };
  const handleDelete = async (p: Product) => {
    if (!user) return;
    try {
      await deleteProduct(p.id, user.id);
      toast({
        title: t("Cerere de ștergere trimisă", "Deletion request sent"),
        description: t(
          `Anunțul „${p.title}" a fost ascuns și va fi șters după confirmarea unui administrator.`,
          `"${p.title}" was hidden and will be deleted after an admin confirms it.`,
        ),
      });
      refresh();
      setConfirmDelete(null);
    } catch (e: any) {
      if (e?.code === "PRODUCT_HAS_ACTIVE_RENTALS" || String(e?.message || "").includes("PRODUCT_HAS_ACTIVE_RENTALS")) {
        toast({
          variant: "destructive",
          title: t("Nu poți șterge acest anunț", "Cannot delete this listing"),
          description: t(
            "Anunțul are închirieri active în desfășurare. Finalizează sau anulează închirierile înainte de a-l șterge.",
            "This listing has active rentals in progress. Complete or cancel them before deleting.",
          ),
        });
        setConfirmDelete(null);
        return;
      }
      toast({
        variant: "destructive",
        title: t("Eroare la ștergere", "Delete failed"),
        description: e?.message || t("A apărut o eroare.", "Something went wrong."),
      });
    }
  };

  const handleCancelDeletion = async (p: Product) => {
    try {
      await cancelProductDeletionRequest(p.id);
      toast({ title: t("Cererea de ștergere a fost anulată", "Deletion request cancelled") });
      refresh();
    } catch (e: any) {
      toast({ variant: "destructive", title: t("Eroare", "Error"), description: e?.message });
    }
  };


  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasNoProducts = products.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-6 pt-24 lg:pt-8 pb-28 sm:pb-12 space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/profile")}>
          <ArrowLeft className="h-4 w-4" /> {t("Înapoi la Contul Meu", "Back to My Account")}
        </Button>

        <Tabs value={topTab} onValueChange={setTopTab} className="space-y-6">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("Produsele mele", "My listings")}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t(
                  (stats?.total ?? products.length) === 1 ? "Gestionează anunțul tău." : `Gestionează cele ${stats?.total ?? products.length} anunțuri ale tale.`,
                  (stats?.total ?? products.length) === 1 ? "Manage your listing." : `Manage your ${stats?.total ?? products.length} listings.`,
                )}
              </p>
            </div>
            <Button asChild className="hidden sm:inline-flex">
              <Link to="/owner/new-product"><Plus className="h-4 w-4" /> {t("Adaugă produs", "Add product")}</Link>
            </Button>
          </div>

          <TabsList className="grid w-full grid-cols-2 h-auto bg-muted/60 p-1 sm:inline-flex sm:w-auto">
            <TabsTrigger
              value="anunturi"
              className="gap-2 px-4 py-2.5 font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <Package className="h-4 w-4" />
              {t("Anunțuri", "Listings")}
            </TabsTrigger>
            <TabsTrigger
              value="cereri"
              className="relative gap-2 px-4 py-2.5 font-semibold data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm"
            >
              <Inbox className="h-4 w-4" />
              {t("Cereri primite", "Requests received")}
              {(stats?.new_requests ?? 0) > 0 && (
                <>
                  <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground hover:bg-primary">
                    {(stats?.new_requests ?? 0) > 9 ? "9+" : stats?.new_requests}
                  </Badge>
                  {topTab !== "cereri" && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                    </span>
                  )}
                </>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="anunturi" className="space-y-6 mt-0">
        {draft && (
          <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm">
                {t("Ai un draft nesalvat", "You have an unsaved draft")}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {(draft.payload as any)?.title?.trim() || t("Anunț fără titlu", "Untitled listing")}
                {(draft.payload as any)?.category ? ` · ${(draft.payload as any).category}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to="/owner/new-product">{t("Continuă", "Continue")}</Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => setConfirmDeleteDraft(true)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t("Șterge", "Delete")}</span>
              </Button>
            </div>
          </div>
        )}

        {hasNoProducts ? (
          <ListingsEmptyState />
        ) : (
          <>
            <Select
              value={filters.status}
              onValueChange={(v) => {
                if (v === "__cereri__") {
                  setTopTab("cereri");
                  return;
                }
                setFilters((f) => ({ ...f, status: v as ListingsFilters["status"] }));
              }}
            >
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue placeholder={t("Filtrează", "Filter")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("Toate", "All")} ({stats?.total ?? products.length})
                </SelectItem>
                <SelectItem value="active">
                  {t("Active", "Active")} ({stats?.active ?? 0})
                </SelectItem>
                <SelectItem value="pending">
                  {t("În verificare", "In review")} ({stats?.pending ?? 0})
                </SelectItem>
                <SelectItem value="hidden">
                  {t("Ascunse", "Hidden")} ({stats?.hidden ?? 0})
                </SelectItem>
                <SelectItem value="rejected">
                  {t("Respinse", "Rejected")} ({stats?.rejected ?? 0})
                </SelectItem>
                <SelectItem value="__cereri__">
                  {t("Cereri noi", "New requests")} ({stats?.new_requests ?? 0})
                </SelectItem>
              </SelectContent>
            </Select>

            <ListingsFilterBar
              filters={filters}
              onChange={setFilters}
              categories={categories}
              resultCount={filtered.length}
            />

            {filtered.length === 0 ? (
              <ListingsEmptyState filtered />
            ) : (
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => {
                  const status = deriveStatus(p);
                  return (
                    <ListingCard
                      key={p.id}
                      product={p}
                      status={status}
                      onCalendar={status === "rejected" ? undefined : () => setAvailabilityProduct(p)}
                      onHistory={() => setHistoryProduct(p)}
                      onHide={() => setConfirmHide(p)}
                      onActivate={() => handleActivate(p)}
                      onDelete={() => setConfirmDelete(p)}
                      onCancelDeletion={() => handleCancelDeletion(p)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
          </TabsContent>

          <TabsContent value="cereri" className="space-y-4 mt-0">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Inbox className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-bold tracking-tight text-lg">{t("Cereri primite", "Bookings received")}</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  {t("Rezervări pentru anunțurile tale", "Bookings on your listings")}
                </p>
              </div>
            </div>
            <RentalsOutTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-20 left-4 right-4 z-30 sm:hidden">
        <Button asChild size="lg" className="w-full shadow-lg">
          <Link to="/owner/new-product"><Plus className="h-5 w-5" /> {t("Adaugă produs", "Add product")}</Link>
        </Button>
      </div>

      <ListingAvailabilityDialog
        product={availabilityProduct}
        open={!!availabilityProduct}
        onOpenChange={(o) => !o && setAvailabilityProduct(null)}
        onSaved={refresh}
      />

      <ListingHistoryDialog
        product={historyProduct}
        open={!!historyProduct}
        onOpenChange={(o) => !o && setHistoryProduct(null)}
      />

      <AlertDialog open={!!confirmHide} onOpenChange={(o) => !o && setConfirmHide(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Ascunzi anunțul?", "Hide listing?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Produsul nu va mai apărea în căutări, dar îl poți reactiva oricând.",
                "The listing will no longer appear in search, but you can reactivate it anytime.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Anulează", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmHide && handleHide(confirmHide)}>
              {t("Ascunde", "Hide")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Trimiți cererea de ștergere?", "Send deletion request?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Anunțul va fi ascuns imediat și va fi șters definitiv doar după confirmarea unui administrator.",
                "The listing will be hidden immediately and permanently deleted only after an admin confirms it.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Anulează", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              {t("Trimite cererea", "Send request")}
            </AlertDialogAction>

          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDeleteDraft} onOpenChange={setConfirmDeleteDraft}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Ștergi draftul?", "Delete draft?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Draftul va fi eliminat definitiv. Această acțiune nu poate fi anulată.",
                "The draft will be permanently removed. This action cannot be undone.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Anulează", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={handleDeleteDraft}>
              {t("Șterge", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default ListingsPage;
