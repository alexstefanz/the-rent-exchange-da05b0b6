import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, updateProfile, createProfile, Profile } from "@/features/profile/profileApi";
import { Loader2, User, Phone, Mail, MessageCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const profileSchema = z.object({
  full_name: z.string().min(2, "Numele trebuie să aibă minim 2 caractere").optional().or(z.literal("")),
  phone: z.string()
    .regex(/^[+0-9() -]*$/, "Format telefon invalid (doar cifre, +, (), spații, -)")
    .max(20, "Numărul de telefon nu poate depăși 20 caractere")
    .optional()
    .or(z.literal("")),
  email: z.string()
    .email("Format email invalid")
    .max(100, "Email-ul nu poate depăși 100 caractere")
    .optional()
    .or(z.literal("")),
  whatsapp: z.string()
    .regex(/^[+0-9() -]*$/, "Format telefon invalid (doar cifre, +, (), spații, -)")
    .max(20, "Numărul de WhatsApp nu poate depăși 20 caractere")
    .optional()
    .or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", phone: "", email: "", whatsapp: "" },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        let profileData = await getProfile(user.id);
        
        if (!profileData) {
          profileData = await createProfile(user.id, {
            full_name: user.user_metadata?.full_name || null,
          });
        }

        setProfile(profileData);
        form.reset({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          email: profileData.email || "",
          whatsapp: profileData.whatsapp || "",
        });
      } catch (error) {
        console.error("Error loading profile:", error);
        toast({
          title: "Eroare",
          description: "Nu s-a putut încărca profilul",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user, form, toast]);

  const handleSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const updatedProfile = await updateProfile(user.id, {
        full_name: data.full_name || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        whatsapp: data.whatsapp || undefined,
      });
      setProfile(updatedProfile);
      toast({
        title: "Succes",
        description: "Profil actualizat cu succes",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza profilul",
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profilul meu
            </CardTitle>
            <CardDescription>
              Actualizează informațiile profilului tău
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Emailul nu poate fi modificat
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nume complet
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Ion Popescu"
                  {...form.register("full_name")}
                />
                {form.formState.errors.full_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefon
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+40 7XX XXX XXX"
                  maxLength={20}
                  {...form.register("phone")}
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_contact" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email de contact (public)
                </Label>
                <Input
                  id="email_contact"
                  type="email"
                  placeholder="contact@exemplu.ro"
                  maxLength={100}
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Acest email va fi vizibil pentru potențialii clienți
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="+40 7XX XXX XXX"
                  maxLength={20}
                  {...form.register("whatsapp")}
                />
                {form.formState.errors.whatsapp && (
                  <p className="text-sm text-destructive">{form.formState.errors.whatsapp.message}</p>
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
                  Produsele mele
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

export default ProfilePage;
