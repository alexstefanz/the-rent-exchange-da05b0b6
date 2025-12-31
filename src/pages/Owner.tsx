import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getMyProducts, Product, calculateClientPrice } from "@/features/products/productsApi";
import { Loader2, Plus, Package, Edit, MapPin } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Owner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!user) return;

      try {
        const data = await getMyProducts(user.id);
        setProducts(data);
      } catch (error) {
        console.error("Error loading products:", error);
        toast({
          title: "Eroare",
          description: "Nu s-au putut încărca produsele",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadProducts();
    }
  }, [user, toast]);

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
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/owner/edit-product/${product.id}`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editează
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Owner;
