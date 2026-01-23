import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { calculateClientPrice, deleteProduct } from "@/features/products/productsApi";
import { useMyProducts } from "@/hooks/queries/useProducts";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Package, Edit, MapPin, Trash2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Owner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate("/auth");
  }
  
  // Use React Query for products
  const { data: products = [], isLoading } = useMyProducts(user?.id);

  const handleDeleteProduct = async () => {
    if (!productToDelete || !user?.id) return;
    
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete, user.id);
      queryClient.invalidateQueries({ queryKey: ["myProducts", user.id] });
      toast({
        title: "Produs șters",
        description: "Produsul a fost șters cu succes.",
      });
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge produsul. Încearcă din nou.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container py-8 pt-24 lg:pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              Produsele mele
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestionează produsele tale listate
            </p>
          </div>
          <Button asChild>
            <Link to="/owner/new-product">
              <Plus className="h-4 w-4 mr-2" />
              Adaugă produs
            </Link>
          </Button>
        </div>
        
        {products.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nu ai produse listate</h3>
              <p className="text-muted-foreground mb-4">
                Adaugă primul tău produs pentru a începe să câștigi
              </p>
              <Button asChild>
                <Link to="/owner/new-product">
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă primul produs
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const clientPrice = calculateClientPrice(product.daily_price_owner, product.platform_fee_percent);
              
              return (
                <Card key={product.id} className="overflow-hidden group">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {!product.is_active && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <span className="text-sm font-medium text-muted-foreground">Inactiv</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
                      {product.title}
                    </h3>
                    
                    {product.location_city && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-3.5 w-3.5" />
                        {product.location_city}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Preț client</p>
                        <p className="font-heading text-lg font-bold text-primary">
                          {clientPrice} RON<span className="text-sm font-normal text-muted-foreground">/zi</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setProductToDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/owner/edit-product/${product.id}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Editează
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      
      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ești sigur că vrei să ștergi acest produs?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune nu poate fi anulată. Produsul va fi șters permanent din contul tău.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteProduct();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se șterge...
                </>
              ) : (
                "Șterge"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Owner;
