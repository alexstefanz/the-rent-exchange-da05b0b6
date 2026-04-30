import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProfile, updateProfile, createProfile, Profile } from "@/features/profile/profileApi";
import { uploadAvatar } from "@/features/profile/avatarApi";
import { Loader2, User, Phone, Mail, MessageCircle, Camera, Building2, FileText, MapPin } from "lucide-react";

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
  company_name: z.string().max(100, "Max 100 caractere").optional().or(z.literal("")),
  cui: z.string().max(20, "Max 20 caractere").optional().or(z.literal("")),
  reg_com: z.string().max(30, "Max 30 caractere").optional().or(z.literal("")),
  company_address: z.string().max(200, "Max 200 caractere").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileTabProps {
  onProfileLoaded?: (profile: Profile | null) => void;
}

const ProfileTab = ({ onProfileLoaded }: ProfileTabProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", phone: "", email: "", whatsapp: "", company_name: "", cui: "", reg_com: "", company_address: "" },
  });

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

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
        setIsBusiness(profileData.account_type === 'business');
        onProfileLoaded?.(profileData);
        form.reset({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          email: profileData.email || "",
          whatsapp: profileData.whatsapp || "",
          company_name: profileData.company_name || "",
          cui: profileData.cui || "",
          reg_com: profileData.reg_com || "",
          company_address: profileData.company_address || "",
        });
      } catch (error) {
        console.error("Error loading profile:", error);
        toast({
          title: t("Eroare", "Error"),
          description: t("Nu s-a putut încărca profilul", "Could not load profile"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, form, toast, onProfileLoaded, t]);

  const handleSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const updatedProfile = await updateProfile(user.id, {
        full_name: data.full_name || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        whatsapp: data.whatsapp || undefined,
        account_type: isBusiness ? 'business' : 'individual',
        company_name: isBusiness ? (data.company_name || undefined) : undefined,
        cui: isBusiness ? (data.cui || undefined) : undefined,
        reg_com: isBusiness ? (data.reg_com || undefined) : undefined,
        company_address: isBusiness ? (data.company_address || undefined) : undefined,
      });
      setProfile(updatedProfile);
      onProfileLoaded?.(updatedProfile);
      toast({
        title: t("Succes", "Success"),
        description: t("Profil actualizat cu succes", "Profile updated successfully"),
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: t("Eroare", "Error"),
        description: t("Nu s-a putut actualiza profilul", "Could not update profile"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Avatar Card */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">
            {t("Fotografie profil", "Profile photo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="relative mb-4">
            <Avatar className="h-32 w-32 border-4 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !user) return;
                if (file.size > 5 * 1024 * 1024) {
                  toast({ title: t("Eroare", "Error"), description: t("Fișierul este prea mare (max 5MB)", "File is too large (max 5MB)"), variant: "destructive" });
                  return;
                }
                setIsUploadingAvatar(true);
                try {
                  const newUrl = await uploadAvatar(user.id, file);
                  setProfile(prev => prev ? { ...prev, avatar_url: newUrl } : prev);
                  toast({ title: t("Succes", "Success"), description: t("Fotografia a fost actualizată", "Photo updated successfully") });
                } catch (error) {
                  console.error("Avatar upload error:", error);
                  toast({ title: t("Eroare", "Error"), description: t("Nu s-a putut încărca fotografia", "Could not upload photo"), variant: "destructive" });
                } finally {
                  setIsUploadingAvatar(false);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }
              }}
            />
            <Button 
              size="icon" 
              variant="outline" 
              className="absolute bottom-0 right-0 rounded-full h-10 w-10 bg-background"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {t(
              "Adaugă o fotografie pentru a-ți personaliza profilul",
              "Add a photo to personalize your profile"
            )}
          </p>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            {t("Informații personale", "Personal information")}
          </CardTitle>
          <CardDescription>
            {t("Actualizează informațiile profilului tău", "Update your profile information")}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="auth_email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t("Email cont", "Account email")}
              </Label>
              <Input
                id="auth_email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                {t("Emailul nu poate fi modificat", "Email cannot be changed")}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("Nume complet", "Full name")}
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
                {t("Telefon", "Phone")}
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
                {t("Email de contact (public)", "Contact email (public)")}
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
                {t(
                  "Acest email va fi vizibil pentru potențialii clienți",
                  "This email will be visible to potential clients"
                )}
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

            {/* Business account toggle & fields */}
            <div className="border-t pt-6 mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <Building2 className="h-4 w-4" />
                    {t("Cont persoană juridică", "Business account")}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("Activează pentru a adăuga datele companiei", "Enable to add company details")}
                  </p>
                </div>
                <Switch checked={isBusiness} onCheckedChange={setIsBusiness} />
              </div>

              {isBusiness && (
                <div className="space-y-4 pl-0">
                  <div className="space-y-2">
                    <Label htmlFor="company_name" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {t("Denumire firmă", "Company name")}
                    </Label>
                    <Input id="company_name" type="text" placeholder="SC Exemplu SRL" maxLength={100} {...form.register("company_name")} />
                    {form.formState.errors.company_name && <p className="text-sm text-destructive">{form.formState.errors.company_name.message}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cui" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        CUI
                      </Label>
                      <Input id="cui" type="text" placeholder="RO12345678" maxLength={20} {...form.register("cui")} />
                      {form.formState.errors.cui && <p className="text-sm text-destructive">{form.formState.errors.cui.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg_com" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {t("Nr. Reg. Comerțului", "Trade Register No.")}
                      </Label>
                      <Input id="reg_com" type="text" placeholder="J40/1234/2024" maxLength={30} {...form.register("reg_com")} />
                      {form.formState.errors.reg_com && <p className="text-sm text-destructive">{form.formState.errors.reg_com.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t("Adresa companiei", "Company address")}
                    </Label>
                    <Input id="company_address" type="text" placeholder="Str. Exemplu nr. 1, București" maxLength={200} {...form.register("company_address")} />
                    {form.formState.errors.company_address && <p className="text-sm text-destructive">{form.formState.errors.company_address.message}</p>}
                  </div>
                </div>
              )}
            </div>
            
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("Se salvează...", "Saving...")}
                </>
              ) : (
                t("Salvează modificările", "Save changes")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileTab;
