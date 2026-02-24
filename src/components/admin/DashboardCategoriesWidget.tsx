import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { icons } from "lucide-react";
import { FolderTree, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { fetchCategories, updateCategory, deleteCategory, PlatformCategory } from "@/features/admin/categoriesApi";
import LucideIconPicker from "@/components/admin/LucideIconPicker";
import { toast } from "sonner";

const DashboardCategoriesWidget = () => {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useQuery({
    queryKey: ["platformCategories"],
    queryFn: fetchCategories,
  });

  const [editCat, setEditCat] = useState<PlatformCategory | null>(null);
  const [editName, setEditName] = useState("");
  const [editNameEn, setEditNameEn] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [deleteCat, setDeleteCat] = useState<PlatformCategory | null>(null);

  const updateMutation = useMutation({
    mutationFn: (params: { id: string; updates: Partial<PlatformCategory> }) =>
      updateCategory(params.id, params.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platformCategories"] });
      toast.success("Categorie actualizată");
      setEditCat(null);
    },
    onError: () => toast.error("Eroare la actualizare"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platformCategories"] });
      toast.success("Categorie ștearsă");
      setDeleteCat(null);
    },
    onError: () => toast.error("Eroare la ștergere"),
  });

  const openEdit = (cat: PlatformCategory) => {
    setEditCat(cat);
    setEditName(cat.name);
    setEditNameEn(cat.name_en || "");
    setEditIcon(cat.icon || "");
  };

  const handleSave = () => {
    if (!editCat || !editName.trim()) return;
    updateMutation.mutate({
      id: editCat.id,
      updates: { name: editName.trim(), name_en: editNameEn.trim() || null, icon: editIcon || null },
    });
  };

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
                {categories?.length || 0} categorii configurate
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
            <div className="space-y-2">
              {categories.map((cat) => {
                const IconComp = cat.icon && icons[cat.icon as keyof typeof icons];
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
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
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={cat.is_active ? "default" : "secondary"} className="text-xs mr-2">
                        {cat.is_active ? "Activă" : "Inactivă"}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)} title="Editează">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteCat(cat)} title="Șterge">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
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

      {/* Edit Dialog */}
      <Dialog open={!!editCat} onOpenChange={(open) => !open && setEditCat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editează Categorie</DialogTitle>
          </DialogHeader>
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
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Se salvează..." : "Salvează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
              onClick={() => deleteCat && deleteMutation.mutate(deleteCat.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Se șterge..." : "Șterge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DashboardCategoriesWidget;
