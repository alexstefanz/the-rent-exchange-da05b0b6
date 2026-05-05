import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getOwnerProductCount } from "@/features/products/productsApi";
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
import { judete } from "@/data/romaniaLocations";
import { Loader2, ArrowLeft, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ImageUpload from "@/components/products/ImageUpload";
import { containsContactInfo } from "@/lib/inputValidation";
import { useKycGate } from "@/hooks/queries/useKycGate";
import KycGateBanner from "@/components/kyc/KycGateBanner";
import { PhoneRequiredGate, PhoneRequiredDialog, usePhoneRequired } from "@/components/profile/PhoneRequiredGate";

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
  location_county: z.string().min(1, "Selectează un județ"),
  location_city: z.string().min(1, "Selectează o localitate"),
  pickup_address: z.string().max(200, "Adresa nu poate depăși 200 caractere").optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const NewProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const kyc = useKycGate();
  const [isLoading, setIsLoading] = useState(false);
  const phoneGate = usePhoneRequired();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [includedItems, setIncludedItems] = useState<string[]>([]);
  const [newIncludedItem, setNewIncludedItem] = useState("");
  const [feePercent, setFeePercent] = useState<number>(5);
  const [freeListingsLeft, setFreeListingsLeft] = useState<number>(0);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      description: "",
      daily_price_owner: undefined,
      category: "",
      subcategory: "",
      location_county: "",
      location_city: "",
      pickup_address: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      getOwnerProductCount(user.id).then(count => {
        const free = Math.max(0, 3 - count);
        setFreeListingsLeft(free);
        setFeePercent(count < 3 ? 0 : 5);
      });
    }
  }, [user]);

  const selectedCategoryData = categories.find(c => c.name === selectedCategory);

  const handleSubmit = async (data: ProductFormData) => {
    if (!user) return;
    if (!phoneGate.requirePhone()) return;

    setIsLoading(true);
    try {
      await createProduct({
        title: data.title,
        description: data.description,
        daily_price_owner: data.daily_price_owner,
        category: data.category,
        subcategory: data.subcategory,
        location_city: data.location_city,
        location_country: "Romania",
        pickup_address: data.pickup_address,
        images: images,
        included_items: includedItems,
      }, user.id);

      toast({
        title: "Anunț trimis spre aprobare",
        description: "Anunțul tău a fost trimis spre aprobare. Vei fi notificat când un administrator îl aprobă.",
      });

      navigate("/owner");
    } catch (error) {
      console.error("Error creating product:", error);
      const err: any = error;
      if (err?.code === "KYC_REQUIRED" || (typeof err?.message === "string" && err.message.includes("KYC_REQUIRED"))) {
        toast({
          title: "Verificare identitate necesară",
          description: "Te redirecționăm către pagina de verificare KYC.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/verificare"), 600);
        return;
      }
      toast({
        title: "Eroare",
        description: "Nu s-a putut crea produsul",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || kyc.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && !kyc.isVerified) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container max-w-2xl py-8 pt-24 lg:pt-8">
          <Button variant="ghost" className="mb-4" onClick={() => navigate("/owner")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi la produse
          </Button>
          <KycGateBanner reason="publish" />
        </main>
        <Footer />
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

        <PhoneRequiredGate className="mb-4" />
        <PhoneRequiredDialog open={phoneGate.dialogOpen} onOpenChange={phoneGate.setDialogOpen} />

        <Card>
          <CardHeader>
            <CardTitle>Adaugă produs nou</CardTitle>
            <CardDescription>
              Completează informațiile despre produsul pe care vrei să îl listezi
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* 1. Titlu */}
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

              {/* 2. Imagini */}
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

              {/* 3. Categorie + Subcategorie */}
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

              {/* 4. Preț + comision live */}
              <div className="space-y-2">
                <Label htmlFor="price">Preț pe zi (RON) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="50"
                  {...form.register("daily_price_owner", { valueAsNumber: true })}
                />
                {(() => {
                  const ownerPrice = form.watch("daily_price_owner");
                  if (ownerPrice && ownerPrice > 0) {
                    const commission = Math.round(ownerPrice * (feePercent / 100) * 100) / 100;
                    const clientPrice = Math.round((ownerPrice + commission) * 100) / 100;
                    return (
                      <div className="rounded-md bg-muted p-3 text-sm">
                        <p>Clientul va plăti: <span className="font-semibold">{clientPrice} RON</span></p>
                        <p className="text-muted-foreground text-xs mt-1">
                          {feePercent === 0
                            ? "Fără comision — anunț gratuit! 🎉"
                            : `Include ${commission} RON comision platformă (${feePercent}%)`}
                        </p>
                        {freeListingsLeft > 0 && (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                            Mai ai {freeListingsLeft} anunț{freeListingsLeft > 1 ? 'uri' : ''} cu 0% comision
                          </p>
                        )}
                      </div>
                    );
                  }
                  return (
                    <p className="text-xs text-muted-foreground">
                      Acesta este prețul pe care îl primești. {feePercent === 0
                        ? "Acest anunț este fără comision! 🎉"
                        : `Clientul va plăti cu ${feePercent}% mai mult (comision platformă).`}
                    </p>
                  );
                })()}
                {form.formState.errors.daily_price_owner && (
                  <p className="text-sm text-destructive">{form.formState.errors.daily_price_owner.message}</p>
                )}
              </div>

              {/* 5. Descriere */}
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

              {/* 5b. Ce este inclus */}
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

              {/* 6. Locație */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="county">Județ *</Label>
                  <Select
                    value={form.watch("location_county") || ""}
                    onValueChange={(value) => {
                      form.setValue("location_county", value, { shouldValidate: true });
                      form.setValue("location_city", "", { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger id="county">
                      <SelectValue placeholder="Selectează județul" />
                    </SelectTrigger>
                    <SelectContent>
                      {judete.map((j) => (
                        <SelectItem key={j.name} value={j.name}>{j.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.location_county && (
                    <p className="text-sm text-destructive">{form.formState.errors.location_county.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Localitate *</Label>
                  <Select
                    value={form.watch("location_city") || ""}
                    onValueChange={(value) => form.setValue("location_city", value, { shouldValidate: true })}
                    disabled={!form.watch("location_county")}
                  >
                    <SelectTrigger id="city">
                      <SelectValue placeholder={form.watch("location_county") ? "Selectează localitatea" : "Alege întâi județul"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(judete.find((j) => j.name === form.watch("location_county"))?.localitati || []).map((loc) => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.location_city && (
                    <p className="text-sm text-destructive">{form.formState.errors.location_city.message}</p>
                  )}
                </div>
              </div>

              {/* 7. Adresă ridicare */}
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
              
              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading || !phoneGate.hasValidPhone}>
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
