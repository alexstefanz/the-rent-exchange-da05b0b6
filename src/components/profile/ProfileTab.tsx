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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProfile, updateProfile, createProfile, Profile } from "@/features/profile/profileApi";
import { uploadAvatar } from "@/features/profile/avatarApi";
import { Loader2, User, Phone, Mail, MessageCircle, Camera } from "lucide-react";

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
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileTabProps {
  onProfileLoaded?: (profile: Profile | null) => void;
}

const ProfileTab = ({ onProfileLoaded }: ProfileTabProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", phone: "", email: "" },
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
        onProfileLoaded?.(profileData);
        form.reset({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          email: profileData.email || "",
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
      });
      setProfile(updatedProfile);
      onProfileLoaded?.(updatedProfile);
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["currentUserProfile", user.id] });
      }
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
                disabled={(profile as any)?.full_name_locked === true}
                className={(profile as any)?.full_name_locked ? "bg-muted" : undefined}
                {...form.register("full_name")}
              />
              {(profile as any)?.full_name_locked === true ? (
                <p className="text-xs text-muted-foreground">
                  {t(
                    "Numele a fost confirmat și nu poate fi modificat. Contactează-ne dacă ai nevoie de o corecție.",
                    "Your name has been confirmed and cannot be changed. Contact us if you need a correction."
                  )}
                </p>
              ) : (
                form.formState.errors.full_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
                )
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
