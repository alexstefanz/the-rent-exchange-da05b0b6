import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getProductById, updateProduct, Product } from "@/features/products/productsApi";
import { categories } from "@/data/categories";
import { Loader2, ArrowLeft, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ImageUpload from "@/components/products/ImageUpload";
import { containsContactInfo } from "@/lib/inputValidation";

const CONTACT_INFO_ERROR = "Descrierea nu poate conține date de contact (telefon, email sau link-uri). Comunicarea se face prin platforma Rentli.";

const productSchema = z.object({
  title: z.string().min(5, "Titlul trebuie să aibă minim 5 caractere").max(100, "Titlul nu poate depăși 100 caractere"),
  description: z.string().max(2000, "Descrierea nu poate depăși 2000 caractere").optional().refine(
    (val) => !val || !containsContactInfo(val),
    { message: CONTACT_INFO_ERROR }
  ),
  daily_price_owner: z.number({ invalid_type_error: "Introdu un preț valid" }).min(1, "Prețul minim este 1 RON"),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  location_city: z.string().optional(),
  location_country: z.string().optional(),
  pickup_address: z.string().max(200, "Adresa nu poate depăși 200 caractere").optional(),
  is_active: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [includedItems, setIncludedItems] = useState<string[]>([]);
  const [newIncludedItem, setNewIncludedItem] = useState("");

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
      pickup_address: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id || !user) return;

      try {
        const data = await getProductById(id);
        
        if (!data) {
          toast({
            title: "Eroare",
            description: "Produsul nu a fost găsit",
            variant: "destructive",
          });
          navigate("/owner");
          return;
        }

        if (data.owner_id !== user.id) {
          toast({
            title: "Acces interzis",
            description: "Nu ai permisiunea să editezi acest produs",
            variant: "destructive",
          });
          navigate("/owner");
          return;
        }

        setProduct(data);
        setSelectedCategory(data.category || "");
        setImages(data.images || []);
        setIncludedItems((data as any).included_items || []);
        form.reset({
          title: data.title,
          description: data.description || "",
          daily_price_owner: data.daily_price_owner,
          category: data.category || "",
          subcategory: data.subcategory || "",
          location_city: data.location_city || "",
          location_country: data.location_country || "Romania",
          pickup_address: (data as any).pickup_address || "",
          is_active: data.is_active,
        });
      } catch (error) {
        console.error("Error loading product:", error);
        toast({
          title: "Eroare",
          description: "Nu s-a putut încărca produsul",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadProduct();
    }
  }, [id, user, form, toast, navigate]);

  const selectedCategoryData = categories.find(c => c.name === selectedCategory);

  const handleSubmit = async (data: ProductFormData) => {
    if (!user || !id) return;

    setIsSaving(true);
    try {
      await updateProduct(id, {
        title: data.title,
        description: data.description,
        daily_price_owner: data.daily_price_owner,
        category: data.category,
        subcategory: data.subcategory,
        location_city: data.location_city,
        location_country: data.location_country,
        pickup_address: data.pickup_address,
        is_active: data.is_active,
        images: images,
        included_items: includedItems,
      }, user.id);

      toast({
        title: "Succes",
        description: "Produsul a fost actualizat cu succes",
      });
      navigate("/owner");
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza produsul",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
      
      <main className="flex-1 container max-w-2xl py-8 pt-24 lg:pt-8">
        <Button variant="ghost" className="mb-4" onClick={() => navigate("/owner")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Înapoi la produse
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Editează produs</CardTitle>
            <CardDescription>
              Modifică informațiile despre produs
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="is_active" className="font-medium">Produs activ</Label>
                  <p className="text-sm text-muted-foreground">
                    Dezactivează pentru a ascunde produsul din listări
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={form.watch("is_active")}
                  onCheckedChange={(checked) => form.setValue("is_active", checked)}
                />
              </div>
              
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
                  Acesta este prețul pe care îl primești. Comisionul platformei ({product?.platform_fee_percent ?? 5}%) este adăugat automat la prețul clientului.
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
                <Label htmlFor="pickup_address">Adresă ridicare produs</Label>
                <Input
                  id="pickup_address"
                  placeholder="Ex: Strada Exemplu nr. 10, Sector 1, București"
                  {...form.register("pickup_address")}
                />
                <p className="text-xs text-muted-foreground">
                  Adresa de unde se poate ridica produsul. Va apărea pe hartă.
                </p>
                {form.formState.errors.pickup_address && (
                  <p className="text-sm text-destructive">{form.formState.errors.pickup_address.message}</p>
                )}
              </div>
              
              {/* Ce este inclus */}
              <div className="space-y-2">
                <Label>Ce este inclus (accesorii)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: Husă transport, Încărcător"
                    value={newIncludedItem}
                    onChange={(e) => setNewIncludedItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const trimmed = newIncludedItem.trim();
                        if (trimmed && !includedItems.includes(trimmed)) {
                          setIncludedItems([...includedItems, trimmed]);
                          setNewIncludedItem("");
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const trimmed = newIncludedItem.trim();
                      if (trimmed && !includedItems.includes(trimmed)) {
                        setIncludedItems([...includedItems, trimmed]);
                        setNewIncludedItem("");
                      }
                    }}
                  >
                    Adaugă
                  </Button>
                </div>
                {includedItems.length > 0 && (
                  <ul className="space-y-1 mt-2">
                    {includedItems.map((item, index) => (
                      <li key={index} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                        <span>{item}</span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setIncludedItems(includedItems.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-muted-foreground">
                  Adaugă accesoriile sau elementele incluse cu produsul.
                </p>
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
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Se salvează...
                    </>
                  ) : (
                    "Salvează modificările"
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

export default EditProduct;
