import { useState, useMemo, useEffect } from "react";
import { Package, Search, Loader2, Flag, Eye, EyeOff, Trash2, AlertTriangle, Star, MessageSquare, CheckCircle, XCircle, ChevronDown, ChevronUp, MapPin, Calendar, Tag, User, DollarSign, FileText, List, Pencil, ShieldAlert } from "lucide-react";
import SortableTableHead, { SortDirection, sortData, useToggleSort } from "@/components/admin/SortableTableHead";
import TableColumnFilterRow, { applyColumnFilters, ColumnFilterConfig } from "@/components/admin/TableColumnFilter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAdminProducts, toggleProductActive, flagProduct, unflagProduct, deleteProduct, approveProduct, rejectProduct, fetchProductFullDetails, updateProductAdmin, AdminProduct, fetchDeletedProducts, restoreProduct, DeletedProduct } from "@/features/admin/adminProductsApi";
import { fetchProductReviews, deleteProductReview, AdminProductReview } from "@/features/admin/adminReviewsApi";
import { RotateCcw, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "@/components/ui/sonner";

// Expanded detail panel showing full product info + action buttons
const ProductExpandedPanel = ({
  product,
  extraDetails,
  extraLoading,
  actionLoading,
  onApprove,
  onReject,
  onToggleActive,
  onFlag,
  onUnflag,
  onDelete,
  onOpenReviews,
  onEdit,
  formatCurrency,
}: {
  product: AdminProduct;
  extraDetails: { description: string | null; included_items: string[] | null; location_country: string | null; pickup_address: string | null } | null;
  extraLoading: boolean;
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onToggleActive: (p: AdminProduct) => void;
  onFlag: (id: string) => void;
  onUnflag: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  onOpenReviews: (id: string, title: string) => void;
  onEdit: (p: AdminProduct) => void;
  formatCurrency: (v: number) => string;
}) => {
  const isLoading = actionLoading === product.id;

  return (
    <div className="p-4 space-y-4 bg-muted/30 border-t">
      {/* Images gallery */}
      {product.images && product.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {product.images.map((img, i) => (
            <img key={i} src={img} alt={`${product.title} ${i + 1}`} className="h-24 w-24 md:h-32 md:w-32 rounded-lg object-cover flex-shrink-0 border" />
          ))}
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
        <div className="flex items-start gap-2">
          <Tag className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div><span className="text-muted-foreground">Categorie:</span> <span className="font-medium">{product.category || '-'}</span></div>
        </div>
        <div className="flex items-start gap-2">
          <Tag className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div><span className="text-muted-foreground">Subcategorie:</span> <span className="font-medium">{product.subcategory || '-'}</span></div>
        </div>
        <div className="flex items-start gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div><span className="text-muted-foreground">Preț/zi:</span> <span className="font-medium">{formatCurrency(product.daily_price_owner)}</span></div>
        </div>
        <div className="flex items-start gap-2">
          <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div><span className="text-muted-foreground">Proprietar:</span> <span className="font-medium">{product.owner_name}</span></div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div><span className="text-muted-foreground">Oraș:</span> <span className="font-medium">{product.location_city || '-'}</span></div>
        </div>
        {extraLoading ? (
          <Skeleton className="h-5 w-32" />
        ) : extraDetails && (
          <>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div><span className="text-muted-foreground">Țară:</span> <span className="font-medium">{extraDetails.location_country || '-'}</span></div>
            </div>
            <div className="flex items-start gap-2 sm:col-span-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div><span className="text-muted-foreground">Adresă ridicare:</span> <span className="font-medium">{extraDetails.pickup_address || '-'}</span></div>
            </div>
          </>
        )}
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div><span className="text-muted-foreground">Creat:</span> <span className="font-medium">{format(new Date(product.created_at), 'd MMM yyyy', { locale: ro })}</span></div>
        </div>
      </div>

      {/* Description */}
      {(product.description || (extraDetails && extraDetails.description)) && (
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <FileText className="h-4 w-4" /> Descriere
          </div>
          <p className="text-sm bg-background rounded-md p-3 border">{product.description || extraDetails?.description || '-'}</p>
        </div>
      )}

      {/* Included items */}
      {!extraLoading && extraDetails?.included_items && extraDetails.included_items.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <List className="h-4 w-4" /> Ce este inclus
          </div>
          <div className="flex flex-wrap gap-1">
            {extraDetails.included_items.map((item, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Admin edited note */}
      {product.admin_edited_at && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded-md px-3 py-2 border border-amber-200 dark:border-amber-800">
          <ShieldAlert className="h-4 w-4 flex-shrink-0" />
          Editat de admin la {format(new Date(product.admin_edited_at), "d MMM yyyy, HH:mm", { locale: ro })}
        </div>
      )}

      <Separator />

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(product)} disabled={isLoading}>
          <Pencil className="h-4 w-4 mr-1" /> Editează
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.open(`/produs/${product.slug}`, '_blank')} disabled={isLoading}>
          <Eye className="h-4 w-4 mr-1" /> Vezi pe site
        </Button>

        {product.approval_status === 'pending' && (
          <>
            <Button size="sm" onClick={() => onApprove(product.id)} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="h-4 w-4 mr-1" /> Aprobă
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onReject(product.id)} disabled={isLoading}>
              <XCircle className="h-4 w-4 mr-1" /> Respinge
            </Button>
          </>
        )}

        <Button variant="outline" size="sm" onClick={() => onToggleActive(product)} disabled={isLoading}>
          {product.is_active ? <><EyeOff className="h-4 w-4 mr-1" /> Dezactivează</> : <><Eye className="h-4 w-4 mr-1" /> Activează</>}
        </Button>

        {product.admin_flagged ? (
          <Button variant="outline" size="sm" onClick={() => onUnflag(product.id)} disabled={isLoading}>
            <Flag className="h-4 w-4 mr-1" /> Ridică flag
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => onFlag(product.id)} disabled={isLoading}>
            <Flag className="h-4 w-4 mr-1" /> Marchează suspect
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={() => onOpenReviews(product.id, product.title)} disabled={isLoading}>
          <MessageSquare className="h-4 w-4 mr-1" /> Recenzii
        </Button>

        <Button variant="destructive" size="sm" onClick={() => onDelete(product.id, product.title)} disabled={isLoading}>
          <Trash2 className="h-4 w-4 mr-1" /> Șterge
        </Button>
      </div>
    </div>
  );
};

// Status badge helper
const ProductStatusBadges = ({ product }: { product: AdminProduct }) => (
  <div className="flex flex-wrap gap-1">
    {product.approval_status === 'pending' && (
      <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">În așteptare</Badge>
    )}
    {product.approval_status === 'rejected' && (
      <Badge variant="destructive">Respins</Badge>
    )}
    {product.approval_status === 'approved' && (
      <Badge variant={product.is_active ? "default" : "secondary"}>
        {product.is_active ? "Activ" : "Inactiv"}
      </Badge>
    )}
    {product.admin_flagged && <Badge variant="destructive">Marcat</Badge>}
  </div>
);

const AdminProducts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [extraDetails, setExtraDetails] = useState<Record<string, { description: string | null; included_items: string[] | null; location_country: string | null; pickup_address: string | null }>>({});
  const [extraLoading, setExtraLoading] = useState<string | null>(null);
  const [flagDialog, setFlagDialog] = useState<{ open: boolean; productId: string }>({ open: false, productId: "" });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: string; title: string }>({ open: false, productId: "", title: "" });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; productId: string }>({ open: false, productId: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [reviewsDialog, setReviewsDialog] = useState<{ open: boolean; productId: string; title: string }>({ open: false, productId: "", title: "" });
  const [reviewsData, setReviewsData] = useState<AdminProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; product: AdminProduct | null }>({ open: false, product: null });
  const [editForm, setEditForm] = useState({ title: "", description: "", daily_price_owner: 0, category: "", subcategory: "", is_active: true });
  const [editSaving, setEditSaving] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [dateRangeFilters, setDateRangeFilters] = useState<Record<string, { from?: Date; to?: Date }>>({});
  const queryClient = useQueryClient();
  const handleSort = useToggleSort(setSortKey, setSortDirection, sortKey, sortDirection);

  const handleColumnFilter = (key: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateRangeChange = (key: string, range: { from?: Date; to?: Date }) => {
    setDateRangeFilters(prev => ({ ...prev, [key]: range }));
  };

  const { data: categories } = useQuery({
    queryKey: ['platformCategories'],
    queryFn: async () => {
      const { data } = await supabase.from('platform_categories').select('id, name').eq('is_active', true).order('sort_order');
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: subcategories } = useQuery({
    queryKey: ['platformSubcategories'],
    queryFn: async () => {
      const { data } = await supabase.from('platform_subcategories').select('category_id, name').eq('is_active', true).order('sort_order');
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['adminProducts', debouncedSearch, statusFilter, sourceFilter],
    queryFn: () => fetchAdminProducts(
      debouncedSearch || undefined,
      statusFilter === 'all' ? undefined : statusFilter,
      undefined,
      50,
      0,
      sourceFilter === 'all' ? undefined : sourceFilter
    ),
    staleTime: 30000,
  });

  const { data: deletedProducts = [], isLoading: deletedLoading } = useQuery({
    queryKey: ['adminDeletedProducts'],
    queryFn: () => fetchDeletedProducts(),
    staleTime: 30000,
  });

  const handleRestoreDeleted = async (id: string) => {
    try {
      await restoreProduct(id);
      await queryClient.invalidateQueries({ queryKey: ['adminDeletedProducts'] });
      await queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      toast.success('Produs restaurat');
    } catch (e: any) {
      toast.error(e?.message || 'Eroare la restaurare');
    }
  };

  const handlePurgeDeleted = async (id: string, title: string) => {
    if (!confirm(`Șterge definitiv „${title}"? Acțiunea este ireversibilă.`)) return;
    try {
      await deleteProduct(id);
      await queryClient.invalidateQueries({ queryKey: ['adminDeletedProducts'] });
      toast.success('Produs șters definitiv');
    } catch (e: any) {
      toast.error(e?.message || 'Eroare la ștergere');
    }
  };

  // Dynamic options from data
  const cityOptions = useMemo(() => {
    if (!products) return [];
    const cities = [...new Set(products.map(p => p.location_city).filter(Boolean))];
    return cities.sort((a, b) => a!.localeCompare(b!, 'ro')).map(c => ({ value: c!, label: c! }));
  }, [products]);

  const categoryOptions = useMemo(() => {
    if (!categories) return [];
    return categories.map(c => ({ value: c.name, label: c.name }));
  }, [categories]);

  const subcategoryOptions = useMemo(() => {
    if (!subcategories || !categories || !editForm.category) return [];
    const cat = categories.find(c => c.name === editForm.category);
    if (!cat) return [];
    return subcategories
      .filter(s => s.category_id === cat.id)
      .map(s => ({ value: s.name, label: s.name }));
  }, [subcategories, categories, editForm.category]);

  const productColumnFilters: ColumnFilterConfig[] = [
    { key: "title", type: "text", placeholder: "Titlu..." },
    { key: "owner_name", type: "text", placeholder: "Proprietar..." },
    { key: "daily_price_owner", type: "amountrange", placeholder: "Preț" },
    { key: "category", type: "combobox", placeholder: "Categorie", options: categoryOptions },
    { key: "location_city", type: "combobox", placeholder: "Oraș", options: cityOptions },
    { key: "is_active", type: "select", placeholder: "Status", options: [
      { value: "true", label: "Activ" },
      { value: "false", label: "Inactiv" },
    ]},
    { key: "created_at", type: "daterange", placeholder: "Perioadă" },
  ];

  // Fetch extra details when a product is expanded
  useEffect(() => {
    if (expandedProductId && !extraDetails[expandedProductId]) {
      setExtraLoading(expandedProductId);
      fetchProductFullDetails(expandedProductId)
        .then(data => {
          setExtraDetails(prev => ({ ...prev, [expandedProductId]: data }));
        })
        .catch(() => {})
        .finally(() => setExtraLoading(null));
    }
  }, [expandedProductId]);

  const handleToggleExpand = (productId: string) => {
    setExpandedProductId(prev => prev === productId ? null : productId);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  const handleToggleActive = async (product: AdminProduct) => {
    setActionLoading(product.id);
    try {
      await toggleProductActive(product.id, !product.is_active);
      toast.success(product.is_active ? "Produs dezactivat" : "Produs activat");
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    } catch { toast.error("Eroare la actualizare"); }
    finally { setActionLoading(null); }
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) return;
    setActionLoading(flagDialog.productId);
    try {
      await flagProduct(flagDialog.productId, flagReason);
      toast.success("Produs marcat ca suspect");
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      setFlagDialog({ open: false, productId: "" });
      setFlagReason("");
    } catch { toast.error("Eroare"); }
    finally { setActionLoading(null); }
  };

  const handleUnflag = async (productId: string) => {
    setActionLoading(productId);
    try {
      await unflagProduct(productId);
      toast.success("Flag ridicat");
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    } catch { toast.error("Eroare"); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async () => {
    setActionLoading(deleteDialog.productId);
    try {
      await deleteProduct(deleteDialog.productId);
      toast.success("Produs șters definitiv");
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      setDeleteDialog({ open: false, productId: "", title: "" });
    } catch { toast.error("Eroare la ștergere"); }
    finally { setActionLoading(null); }
  };

  const handleApprove = async (productId: string) => {
    setActionLoading(productId);
    try {
      await approveProduct(productId);
      toast.success("Produs aprobat și publicat");
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    } catch { toast.error("Eroare la aprobare"); }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(rejectDialog.productId);
    try {
      await rejectProduct(rejectDialog.productId, rejectReason);
      toast.success("Produs respins");
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      setRejectDialog({ open: false, productId: "" });
      setRejectReason("");
    } catch { toast.error("Eroare la respingere"); }
    finally { setActionLoading(null); }
  };

  const handleOpenReviews = async (productId: string, title: string) => {
    setReviewsDialog({ open: true, productId, title });
    setReviewsLoading(true);
    try {
      const reviews = await fetchProductReviews(productId);
      setReviewsData(reviews);
    } catch { toast.error("Eroare la încărcarea recenziilor"); }
    finally { setReviewsLoading(false); }
  };

  const handleDeleteReview = async (reviewId: string) => {
    setDeletingReviewId(reviewId);
    try {
      await deleteProductReview(reviewId);
      setReviewsData(prev => prev.filter(r => r.id !== reviewId));
      toast.success("Recenzie ștearsă");
    } catch { toast.error("Eroare la ștergerea recenziei"); }
    finally { setDeletingReviewId(null); }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', minimumFractionDigits: 0 }).format(v);

  const filteredData = useMemo(() => {
    return sortData(
      applyColumnFilters(products, columnFilters, dateRangeFilters),
      sortKey,
      sortDirection
    );
  }, [products, columnFilters, dateRangeFilters, sortKey, sortDirection]);

  const handleOpenEdit = (product: AdminProduct) => {
    setEditForm({
      title: product.title,
      description: product.description || "",
      daily_price_owner: product.daily_price_owner,
      category: product.category || "",
      subcategory: product.subcategory || "",
      is_active: product.is_active,
    });
    setEditDialog({ open: true, product });
  };

  const handleSaveEdit = async () => {
    if (!editDialog.product) return;
    setEditSaving(true);
    try {
      await updateProductAdmin(editDialog.product.id, {
        title: editForm.title,
        description: editForm.description,
        daily_price_owner: editForm.daily_price_owner,
        category: editForm.category || undefined,
        subcategory: editForm.subcategory || undefined,
        is_active: editForm.is_active,
      });
      toast.success("Produs actualizat de admin");
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      setEditDialog({ open: false, product: null });
    } catch { toast.error("Eroare la salvare"); }
    finally { setEditSaving(false); }
  };

  const expandedPanelProps = {
    actionLoading,
    onApprove: handleApprove,
    onReject: (id: string) => setRejectDialog({ open: true, productId: id }),
    onToggleActive: handleToggleActive,
    onFlag: (id: string) => setFlagDialog({ open: true, productId: id }),
    onUnflag: handleUnflag,
    onDelete: (id: string, title: string) => setDeleteDialog({ open: true, productId: id, title }),
    onOpenReviews: handleOpenReviews,
    onEdit: handleOpenEdit,
    formatCurrency,
  };

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <h1 className="text-xl font-bold tracking-tight">Gestionare Produse</h1>
            <span className="text-sm text-muted-foreground hidden sm:inline">— Administrează anunțurile</span>
          </div>
        </div>

        <Tabs defaultValue="active" className="space-y-4 md:space-y-6">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="trash" className="gap-2">
              <Trash className="h-4 w-4" /> Coș de gunoi
              {deletedProducts.length > 0 && (
                <Badge variant="secondary" className="ml-1">{deletedProducts.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 md:space-y-6 mt-0">
        {/* Search & Filter */}
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Caută după titlu..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="all">Toate</SelectItem>
                   <SelectItem value="pending">În așteptare</SelectItem>
                   <SelectItem value="active">Active</SelectItem>
                   <SelectItem value="inactive">Inactive</SelectItem>
                   <SelectItem value="rejected">Respinse</SelectItem>
                   <SelectItem value="flagged">Marcate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-lg md:text-2xl">Lista Produselor</CardTitle>
            <CardDescription>{filteredData.length} produse găsite</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : products && products.length > 0 ? (
              <>
                {/* DESKTOP TABLE — hidden on mobile */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead label="Produs" sortKey="title" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableTableHead label="Proprietar" sortKey="owner_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableTableHead label="Preț/zi" sortKey="daily_price_owner" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableTableHead label="Categorie" sortKey="category" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableTableHead label="Oraș" sortKey="location_city" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                        <TableHead>Status</TableHead>
                        <SortableTableHead label="Data" sortKey="created_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableColumnFilterRow
                        filters={productColumnFilters}
                        values={columnFilters}
                        onChange={handleColumnFilter}
                        dateRangeValues={dateRangeFilters}
                        onDateRangeChange={handleDateRangeChange}
                      />
                      {filteredData.map((product) => (
                        <>
                          <TableRow
                            key={product.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleToggleExpand(product.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {product.images?.[0] && (
                                  <img src={product.images[0]} alt="" className="h-10 w-10 rounded object-cover" />
                                )}
                                <div>
                                  <span className="font-medium line-clamp-1">{product.title}</span>
                                  {product.admin_flagged && (
                                    <div className="flex items-center gap-1 text-xs text-destructive">
                                      <AlertTriangle className="h-3 w-3" /> {product.flag_reason}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{product.owner_name}</TableCell>
                            <TableCell>{formatCurrency(product.daily_price_owner)}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{product.category || '-'}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{product.location_city || '-'}</TableCell>
                            <TableCell><ProductStatusBadges product={product} /></TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {format(new Date(product.created_at), 'd MMM yyyy', { locale: ro })}
                            </TableCell>
                            <TableCell>
                              {expandedProductId === product.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </TableCell>
                          </TableRow>
                          {expandedProductId === product.id && (
                            <TableRow key={`${product.id}-expanded`}>
                              <TableCell colSpan={8} className="p-0">
                                <ProductExpandedPanel
                                  product={product}
                                  extraDetails={extraDetails[product.id] || null}
                                  extraLoading={extraLoading === product.id}
                                  {...expandedPanelProps}
                                />
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* MOBILE CARDS — hidden on desktop */}
                <div className="md:hidden space-y-3">
                  {filteredData.map((product) => (
                    <div key={product.id} className="border rounded-lg overflow-hidden">
                      {/* Card header — always visible */}
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer active:bg-muted/50"
                        onClick={() => handleToggleExpand(product.id)}
                      >
                        {product.images?.[0] && (
                          <img src={product.images[0]} alt="" className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{product.title}</p>
                          <p className="text-xs text-muted-foreground">{product.owner_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold">{formatCurrency(product.daily_price_owner)}</span>
                            <ProductStatusBadges product={product} />
                          </div>
                          {product.admin_flagged && (
                            <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                              <AlertTriangle className="h-3 w-3" /> {product.flag_reason}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {actionLoading === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : expandedProductId === product.id ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Expanded content */}
                      {expandedProductId === product.id && (
                        <ProductExpandedPanel
                          product={product}
                          extraDetails={extraDetails[product.id] || null}
                          extraLoading={extraLoading === product.id}
                          {...expandedPanelProps}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nu s-au găsit produse</p>
              </div>
            )}
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="trash" className="space-y-4 md:space-y-6 mt-0">
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-2xl flex items-center gap-2">
                <Trash className="h-5 w-5" /> Coș de gunoi
              </CardTitle>
              <CardDescription>
                Produsele șterse de utilizatori sunt păstrate 14 zile înainte de a fi șterse definitiv.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deletedLoading ? (
                <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : deletedProducts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Coșul de gunoi este gol</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produs</TableHead>
                        <TableHead>Proprietar</TableHead>
                        <TableHead>Șters la</TableHead>
                        <TableHead>Zile rămase</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deletedProducts.map((p) => {
                        const deletedAt = new Date(p.deleted_at);
                        const daysSince = Math.floor((Date.now() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));
                        const daysLeft = Math.max(0, 14 - daysSince);
                        return (
                          <TableRow key={p.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {p.images?.[0] && <img src={p.images[0]} alt="" className="h-10 w-10 rounded object-cover" />}
                                <div>
                                  <span className="font-medium line-clamp-1">{p.title}</span>
                                  <div className="text-xs text-muted-foreground">{p.category || '-'} · {formatCurrency(p.daily_price_owner)}/zi</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{p.owner_name}</TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {format(deletedAt, 'd MMM yyyy, HH:mm', { locale: ro })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={daysLeft <= 3 ? "destructive" : "secondary"}>
                                {daysLeft} {daysLeft === 1 ? "zi" : "zile"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleRestoreDeleted(p.id)} className="gap-1">
                                  <RotateCcw className="h-3.5 w-3.5" /> Restaurează
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handlePurgeDeleted(p.id, p.title)} className="gap-1">
                                  <Trash2 className="h-3.5 w-3.5" /> Șterge
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>

      {/* Flag Dialog */}
      <Dialog open={flagDialog.open} onOpenChange={(open) => { setFlagDialog({ open, productId: flagDialog.productId }); if (!open) setFlagReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marchează produs ca suspect</DialogTitle>
            <DialogDescription>Introdu motivul pentru care acest produs este suspect.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Motivul..." value={flagReason} onChange={(e) => setFlagReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialog({ open: false, productId: "" })}>Anulează</Button>
            <Button variant="destructive" onClick={handleFlag} disabled={!flagReason.trim()}>Marchează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmare ștergere</DialogTitle>
            <DialogDescription>Ești sigur că vrei să ștergi definitiv „{deleteDialog.title}"? Această acțiune nu poate fi anulată.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, productId: "", title: "" })}>Anulează</Button>
            <Button variant="destructive" onClick={handleDelete}>Șterge definitiv</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => { setRejectDialog({ open, productId: rejectDialog.productId }); if (!open) setRejectReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respinge produs</DialogTitle>
            <DialogDescription>Introdu motivul respingerii.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Motivul respingerii..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, productId: "" })}>Anulează</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>Respinge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reviews Dialog */}
      <Dialog open={reviewsDialog.open} onOpenChange={(open) => { if (!open) setReviewsDialog({ open: false, productId: "", title: "" }); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" /> Recenzii — {reviewsDialog.title}
            </DialogTitle>
            <DialogDescription>{reviewsData.length} recenzii</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {reviewsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : reviewsData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nicio recenzie pentru acest produs.</p>
            ) : (
              <div className="space-y-4 pr-2">
                {reviewsData.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={review.reviewer_avatar || undefined} />
                          <AvatarFallback>{(review.reviewer_name || "?")[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{review.reviewer_name || "Anonim"}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(review.created_at), 'd MMM yyyy', { locale: ro })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {review.rating}/5
                        </Badge>
                        <Badge variant="secondary" className="text-xs">{review.review_type === "owner" ? "Proprietar" : "Chiriaș"}</Badge>
                      </div>
                    </div>
                    {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                    {(review.rating_product_condition || review.rating_communication || review.rating_punctuality) && (
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        {review.rating_product_condition && <span>Stare: {review.rating_product_condition}/5</span>}
                        {review.rating_communication && <span>Comunicare: {review.rating_communication}/5</span>}
                        {review.rating_punctuality && <span>Punctualitate: {review.rating_punctuality}/5</span>}
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteReview(review.id)}
                        disabled={deletingReviewId === review.id}
                      >
                        {deletingReviewId === review.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                        Șterge
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => { if (!open) setEditDialog({ open: false, product: null }); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" /> Editează produs
            </DialogTitle>
            <DialogDescription>Modificările vor fi marcate cu „Editat de admin".</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titlu</label>
              <Input value={editForm.title} onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descriere</label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Preț/zi (RON)</label>
                <Input type="number" min={0} value={editForm.daily_price_owner} onChange={(e) => setEditForm(f => ({ ...f, daily_price_owner: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={editForm.is_active ? "active" : "inactive"} onValueChange={(v) => setEditForm(f => ({ ...f, is_active: v === "active" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activ</SelectItem>
                    <SelectItem value="inactive">Inactiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Categorie</label>
                <Select value={editForm.category || undefined} onValueChange={(v) => setEditForm(f => ({ ...f, category: v, subcategory: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Selectează categoria" /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subcategorie</label>
                <Select
                  value={editForm.subcategory || undefined}
                  onValueChange={(v) => setEditForm(f => ({ ...f, subcategory: v }))}
                  disabled={!editForm.category || subcategoryOptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!editForm.category ? "Alege întâi categoria" : subcategoryOptions.length === 0 ? "Fără subcategorii" : "Selectează subcategoria"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategoryOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, product: null })}>Anulează</Button>
            <Button onClick={handleSaveEdit} disabled={editSaving || !editForm.title.trim()}>
              {editSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminProducts;
