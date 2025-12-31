import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createProduct } from "@/features/products/productsApi";
import { categories } from "@/data/categories";
import { Loader2, ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ImageUpload from "@/components/products/ImageUpload";

const productSchema = z.object({
  title: z.string().min(5, "Titlul trebuie să aibă minim 5 caractere").max(100, "Titlul nu poate depăși 100 caractere"),
  description: z.string().max(2000, "Descrierea nu poate depăși 2000 caractere").optional(),
  daily_price_owner: z.number({ invalid_type_error: "Introdu un preț valid" }).min(1, "Prețul minim este 1 RON"),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  location_city: z.string().optional(),
  location_country: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const NewProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      description: "",
      daily_price_owner: undefined,
      category: "",
      subcategory: "",
      location_city: "",
      location_country: "Romania",
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const selectedCategoryData = categories.find(c => c.name === selectedCategory);

  const handleSubmit = async (data: ProductFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      await createProduct({
        title: data.title,
        description: data.description,
        daily_price_owner: data.daily_price_owner,
        category: data.category,
        subcategory: data.subcategory,
        location_city: data.location_city,
        location_country: data.location_country || "Romania",
        images: images,
      }, user.id);

      toast({
        title: "Succes",
        description: "Produsul a fost creat cu succes",
      });
      navigate("/owner");
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut crea produsul",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container max-w-2xl py-8 pt-24 lg:pt-8">
        <Button variant="ghost" className="mb-4" onClick={() => navigate("/owner")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Înapoi la produse
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Adaugă produs nou</CardTitle>
            <CardDescription>
              Completează informațiile despre produsul pe care vrei să îl listezi
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titlu *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Bicicletă montană pentru adulți"
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descriere</Label>
                <Textarea
                  id="description"
                  placeholder="Descrie produsul în detaliu..."
                  rows={4}
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Preț pe zi (RON) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="50"
                  {...form.register("daily_price_owner", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Acesta este prețul pe care îl primești. Clientul va plăti cu 20% mai mult (comision platformă).
                </p>
                {form.formState.errors.daily_price_owner && (
                  <p className="text-sm text-destructive">{form.formState.errors.daily_price_owner.message}</p>
                )}
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select 
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      form.setValue("category", value);
                      form.setValue("subcategory", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectează categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Subcategorie</Label>
                  <Select 
                    value={form.watch("subcategory")}
                    onValueChange={(value) => form.setValue("subcategory", value)}
                    disabled={!selectedCategoryData}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectează subcategoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCategoryData?.subcategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.name}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Oraș</Label>
                  <Input
                    id="city"
                    placeholder="București"
                    {...form.register("location_city")}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Țară</Label>
                  <Input
                    id="country"
                    placeholder="Romania"
                    {...form.register("location_country")}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Imagini produs</Label>
                {user && (
                  <ImageUpload
                    userId={user.id}
                    images={images}
                    onChange={setImages}
                    maxImages={5}
                  />
                )}
              </div>
              
              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Se creează...
                    </>
                  ) : (
                    "Creează produsul"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/owner")}>
                  Anulează
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default NewProduct;
