import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { icons } from "lucide-react";
import { FolderTree, Pencil, Trash2, ChevronDown, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  fetchCategories, fetchSubcategories,
  updateCategory, deleteCategory,
  updateSubcategory, deleteSubcategory,
  PlatformCategory, PlatformSubcategory
} from "@/features/admin/categoriesApi";
import LucideIconPicker from "@/components/admin/LucideIconPicker";
import { toast } from "sonner";

const DashboardCategoriesWidget = () => {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useQuery({
    queryKey: ["platformCategories"],
    queryFn: fetchCategories,
  });
  const { data: subcategories } = useQuery({
    queryKey: ["platformSubcategories"],
    queryFn: () => fetchSubcategories(),
  });

  // Category edit state
  const [editCat, setEditCat] = useState<PlatformCategory | null>(null);
  const [editName, setEditName] = useState("");
  const [editNameEn, setEditNameEn] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [deleteCat, setDeleteCat] = useState<PlatformCategory | null>(null);

  // Subcategory edit state
  const [editSub, setEditSub] = useState<PlatformSubcategory | null>(null);
  const [editSubName, setEditSubName] = useState("");
  const [editSubNameEn, setEditSubNameEn] = useState("");
  const [editSubDesc, setEditSubDesc] = useState("");
  const [editSubDescEn, setEditSubDescEn] = useState("");
  const [editSubImage, setEditSubImage] = useState("");
  const [editSubSort, setEditSubSort] = useState(0);
  const [deleteSub, setDeleteSub] = useState<PlatformSubcategory | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["platformCategories"] });
    queryClient.invalidateQueries({ queryKey: ["platformSubcategories"] });
  };

  const updateCatMutation = useMutation({
    mutationFn: (params: { id: string; updates: Partial<PlatformCategory> }) =>
      updateCategory(params.id, params.updates),
    onSuccess: () => { invalidateAll(); toast.success("Categorie actualizată"); setEditCat(null); },
    onError: () => toast.error("Eroare la actualizare"),
  });

  const deleteCatMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => { invalidateAll(); toast.success("Categorie ștearsă"); setDeleteCat(null); },
    onError: () => toast.error("Eroare la ștergere"),
  });

  const updateSubMutation = useMutation({
    mutationFn: (params: { id: string; updates: Partial<PlatformSubcategory> }) =>
      updateSubcategory(params.id, params.updates),
    onSuccess: () => { invalidateAll(); toast.success("Subcategorie actualizată"); setEditSub(null); },
    onError: () => toast.error("Eroare la actualizare"),
  });

  const deleteSubMutation = useMutation({
    mutationFn: deleteSubcategory,
    onSuccess: () => { invalidateAll(); toast.success("Subcategorie ștearsă"); setDeleteSub(null); },
    onError: () => toast.error("Eroare la ștergere"),
  });

  const openEditCat = (cat: PlatformCategory) => {
    setEditCat(cat);
    setEditName(cat.name);
    setEditNameEn(cat.name_en || "");
    setEditIcon(cat.icon || "");
  };

  const openEditSub = (sub: PlatformSubcategory) => {
    setEditSub(sub);
    setEditSubName(sub.name);
    setEditSubNameEn(sub.name_en || "");
    setEditSubDesc(sub.description || "");
    setEditSubDescEn(sub.description_en || "");
    setEditSubImage(sub.image_url || "");
    setEditSubSort(sub.sort_order);
  };

  const handleSaveCat = () => {
    if (!editCat || !editName.trim()) return;
    updateCatMutation.mutate({
      id: editCat.id,
      updates: { name: editName.trim(), name_en: editNameEn.trim() || null, icon: editIcon || null },
    });
  };

  const handleSaveSub = () => {
    if (!editSub || !editSubName.trim()) return;
    updateSubMutation.mutate({
      id: editSub.id,
      updates: {
        name: editSubName.trim(),
        name_en: editSubNameEn.trim() || null,
        description: editSubDesc.trim() || null,
        description_en: editSubDescEn.trim() || null,
        image_url: editSubImage.trim() || null,
        sort_order: editSubSort,
      },
    });
  };

  const getSubsForCategory = (catId: string) =>
    (subcategories || []).filter((s) => s.category_id === catId);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5" />
                Categorii Platformă
              </CardTitle>
              <CardDescription>
                {categories?.length || 0} categorii, {subcategories?.length || 0} subcategorii
              </CardDescription>
            </div>
            <a href="/admin/categories">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Vezi toate →
              </Badge>
            </a>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="space-y-1">
              {categories.map((cat) => {
                const IconComp = cat.icon && icons[cat.icon as keyof typeof icons];
                const subs = getSubsForCategory(cat.id);
                return (
                  <Collapsible key={cat.id}>
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-3 flex-1 text-left">
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [&[data-state=open]]:rotate-180" />
                          {IconComp ? (
                            <IconComp className="h-5 w-5 text-primary" />
                          ) : (
                            <FolderTree className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{cat.name}</p>
                            {cat.name_en && (
                              <p className="text-xs text-muted-foreground">{cat.name_en}</p>
                            )}
                          </div>
                          {subs.length > 0 && (
                            <Badge variant="secondary" className="text-xs ml-1">{subs.length}</Badge>
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <div className="flex items-center gap-1">
                        <Badge variant={cat.is_active ? "default" : "secondary"} className="text-xs mr-2">
                          {cat.is_active ? "Activă" : "Inactivă"}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCat(cat)} title="Editează">
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteCat(cat)} title="Șterge">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <CollapsibleContent>
                      {subs.length > 0 ? (
                        <div className="ml-8 mt-1 space-y-1 mb-2">
                          {subs.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between p-2.5 pl-4 rounded-md border border-dashed bg-muted/30 hover:bg-muted/60 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">{sub.name}</p>
                                  {sub.name_en && (
                                    <p className="text-xs text-muted-foreground">{sub.name_en}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge variant={sub.is_active ? "default" : "secondary"} className="text-[10px] mr-1">
                                  {sub.is_active ? "Activă" : "Inactivă"}
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSub(sub)} title="Editează">
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteSub(sub)} title="Șterge">
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="ml-8 mt-1 mb-2 text-xs text-muted-foreground italic pl-4">Nicio subcategorie</p>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nu există categorii configurate</p>
              <a href="/admin/categories" className="text-primary text-sm hover:underline mt-2 inline-block">
                Adaugă categorii →
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={!!editCat} onOpenChange={(open) => !open && setEditCat(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editează Categorie</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nume (RO)</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nume (EN)</Label>
              <Input value={editNameEn} onChange={(e) => setEditNameEn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <LucideIconPicker value={editIcon} onChange={setEditIcon} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCat(null)}>Anulează</Button>
            <Button onClick={handleSaveCat} disabled={updateCatMutation.isPending}>
              {updateCatMutation.isPending ? "Se salvează..." : "Salvează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deleteCat} onOpenChange={(open) => !open && setDeleteCat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge categoria „{deleteCat?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune este ireversibilă. Toate subcategoriile asociate vor fi de asemenea șterse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCat && deleteCatMutation.mutate(deleteCat.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCatMutation.isPending ? "Se șterge..." : "Șterge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Subcategory Dialog */}
      <Dialog open={!!editSub} onOpenChange={(open) => !open && setEditSub(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editează Subcategorie</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nume (RO)</Label>
              <Input value={editSubName} onChange={(e) => setEditSubName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nume (EN)</Label>
              <Input value={editSubNameEn} onChange={(e) => setEditSubNameEn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descriere (RO)</Label>
              <Input value={editSubDesc} onChange={(e) => setEditSubDesc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descriere (EN)</Label>
              <Input value={editSubDescEn} onChange={(e) => setEditSubDescEn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>URL Imagine</Label>
              <Input value={editSubImage} onChange={(e) => setEditSubImage(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Ordine sortare</Label>
              <Input type="number" value={editSubSort} onChange={(e) => setEditSubSort(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSub(null)}>Anulează</Button>
            <Button onClick={handleSaveSub} disabled={updateSubMutation.isPending}>
              {updateSubMutation.isPending ? "Se salvează..." : "Salvează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subcategory Confirmation */}
      <AlertDialog open={!!deleteSub} onOpenChange={(open) => !open && setDeleteSub(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge subcategoria „{deleteSub?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune este ireversibilă.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSub && deleteSubMutation.mutate(deleteSub.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSubMutation.isPending ? "Se șterge..." : "Șterge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DashboardCategoriesWidget;
