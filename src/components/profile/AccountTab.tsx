import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  CreditCard, 
  Wallet,
  Shield,
  Trash2,
  User,
  Phone,
  Mail,
  MessageCircle,
  Camera,
  Loader2,
  LifeBuoy,
  Bell
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { getProfile, updateProfile, createProfile, Profile } from "@/features/profile/profileApi";
import { uploadAvatar } from "@/features/profile/avatarApi";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { useUxCopy } from "@/hooks/useUxCopy";
import { isValidRomanianPhone } from "@/lib/inputValidation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

const IbanForm = ({ userId, profile, onSaved }: { userId?: string; profile: any; onSaved: (iban: string, holder: string) => void }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [iban, setIban] = useState((profile as any)?.iban || "");
  const [holder, setHolder] = useState((profile as any)?.account_holder_name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ iban: iban.toUpperCase(), account_holder_name: holder } as any).eq("id", userId);
      if (error) throw error;
      onSaved(iban.toUpperCase(), holder);
      toast({ title: t("Salvat", "Saved"), description: t("IBAN actualizat cu succes", "IBAN updated successfully") });
    } catch {
      toast({ title: t("Eroare", "Error"), description: t("Nu s-a putut salva IBAN-ul", "Could not save IBAN"), variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="iban">IBAN</Label>
        <Input id="iban" value={iban} onChange={(e) => setIban(e.target.value.toUpperCase().replace(/\s/g, ""))} placeholder="RO49AAAA1B31007593840000" maxLength={34} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="account_holder">{t("Titular cont", "Account holder")}</Label>
        <Input id="account_holder" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Ion Popescu" maxLength={100} />
      </div>
      <Button variant="outline" size="sm" onClick={handleSave} disabled={saving || !iban}>
        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("Se salvează...", "Saving...")}</> : t("Salvează IBAN", "Save IBAN")}
      </Button>
    </div>
  );
};

const AccountTab = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const ux = useUxCopy();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingSms, setIsSavingSms] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", phone: "", email: "", whatsapp: "" },
  });

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
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
        form.reset({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          email: profileData.email || "",
          whatsapp: profileData.whatsapp || "",
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
  }, [user, form, toast, t]);

  const handleSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    // Validare strictă RO pentru telefon (dacă a fost completat)
    if (data.phone && data.phone.trim() && !isValidRomanianPhone(data.phone)) {
      toast({
        title: t("Telefon invalid", "Invalid phone"),
        description: ux.smsNotifications.invalidFormat,
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const normalizedPhone = data.phone ? data.phone.trim().replace(/\s+/g, " ") : "";
      const updatedProfile = await updateProfile(user.id, {
        full_name: data.full_name || undefined,
        phone: normalizedPhone || undefined,
        email: data.email || undefined,
        whatsapp: data.whatsapp || undefined,
      });
      setProfile(updatedProfile);
      // Sync the phone into the auth user metadata as well so the checkout
      // gate (which can read from metadata as a fallback) sees it instantly.
      if (normalizedPhone && isValidRomanianPhone(normalizedPhone)) {
        try {
          await supabase.auth.updateUser({ data: { phone: normalizedPhone } });
        } catch (metaErr) {
          console.warn("Could not sync phone to auth metadata", metaErr);
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["currentUserProfile", user.id] });
      await queryClient.refetchQueries({ queryKey: ["currentUserProfile", user.id] });
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

  const handlePasswordReset = async () => {
    setIsResettingPassword(true);
    try {
      toast({
        title: t("Email trimis", "Email sent"),
        description: t(
          "Verifică-ți emailul pentru instrucțiuni de resetare a parolei",
          "Check your email for password reset instructions"
        ),
      });
    } catch (error) {
      toast({
        title: t("Eroare", "Error"),
        description: t("Nu s-a putut trimite emailul de resetare", "Could not send reset email"),
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const [isDeactivating, setIsDeactivating] = useState(false);

  const phoneFieldValue = form.watch("phone");
  const hasValidPhone = isValidRomanianPhone(phoneFieldValue || profile?.phone || "");
  const smsEnabled = profile?.sms_notifications_enabled !== false;

  const handleSmsToggle = async (next: boolean) => {
    if (!user) return;
    setIsSavingSms(true);
    try {
      const updated = await updateProfile(user.id, { sms_notifications_enabled: next });
      setProfile(updated);
      toast({
        title: t("Salvat", "Saved"),
        description: ux.smsNotifications.saved,
      });
    } catch (error) {
      console.error("Error updating SMS preference:", error);
      toast({
        title: t("Eroare", "Error"),
        description: ux.smsNotifications.saveError,
        variant: "destructive",
      });
    } finally {
      setIsSavingSms(false);
    }
  };

  const handleDeactivateAccount = async () => {
    setIsDeactivating(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-account-deactivation");
      if (error || data?.error) {
        throw new Error(data?.error || error?.message);
      }
      toast({
        title: t("Email trimis", "Email sent"),
        description: t(
          "Verifică-ți emailul pentru a confirma dezactivarea contului.",
          "Check your email to confirm account deactivation."
        ),
      });
    } catch (error: any) {
      console.error("Deactivation request error:", error);
      toast({
        title: t("Eroare", "Error"),
        description: t(
          "Nu s-a putut trimite cererea de dezactivare. Încearcă din nou.",
          "Could not send deactivation request. Try again."
        ),
        variant: "destructive",
      });
    } finally {
      setIsDeactivating(false);
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
    <div className="space-y-6">
      {/* === PROFILE PHOTO + PERSONAL INFO === */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">{t("Fotografie profil", "Profile photo")}</CardTitle>
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
              {t("Adaugă o fotografie pentru a-ți personaliza profilul", "Add a photo to personalize your profile")}
            </p>
          </CardContent>
        </Card>

        {/* Personal Info Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              {t("Informații personale", "Personal information")}
            </CardTitle>
            <CardDescription>{t("Actualizează informațiile profilului tău", "Update your profile information")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auth_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t("Email cont", "Account email")}
                </Label>
                <Input id="auth_email" type="email" value={user?.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">{t("Emailul nu poate fi modificat", "Email cannot be changed")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("Nume complet", "Full name")}
                </Label>
                <Input id="full_name" type="text" placeholder="Ion Popescu" {...form.register("full_name")} />
                {form.formState.errors.full_name && <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t("Telefon", "Phone")}
                </Label>
                <Input id="phone" type="tel" placeholder="+40 7XX XXX XXX" maxLength={20} {...form.register("phone")} />
                {form.formState.errors.phone && <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_contact" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t("Email de contact (public)", "Contact email (public)")}
                </Label>
                <Input id="email_contact" type="email" placeholder="contact@exemplu.ro" maxLength={100} {...form.register("email")} />
                {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Label>
                <Input id="whatsapp" type="tel" placeholder="+40 7XX XXX XXX" maxLength={20} {...form.register("whatsapp")} />
                {form.formState.errors.whatsapp && <p className="text-sm text-destructive">{form.formState.errors.whatsapp.message}</p>}
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("Se salvează...", "Saving...")}</>
                ) : (
                  t("Salvează modificările", "Save changes")
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* === ACCOUNT SETTINGS === */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* KYC Verification Status */}
          <Card className={
            profile?.kyc_status === 'VERIFIED' ? 'border-green-500/30 bg-green-50/30 dark:bg-green-950/10' :
            profile?.kyc_status === 'REJECTED' ? 'border-destructive/30 bg-destructive/5' :
            (profile?.kyc_status === 'SUBMITTED' || profile?.kyc_status === 'NEEDS_MANUAL_REVIEW') ? 'border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10' :
            ''
          }>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                {t("Verificare identitate (KYC)", "Identity verification (KYC)")}
              </CardTitle>
              <CardDescription>
                {t("Verificarea identității tale crește încrederea celorlalți utilizatori", "Identity verification increases trust from other users")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("Status verificare", "Verification status")}</span>
                <Badge variant={
                  profile?.kyc_status === 'VERIFIED' ? 'default' :
                  profile?.kyc_status === 'REJECTED' ? 'destructive' :
                  (profile?.kyc_status === 'SUBMITTED' || profile?.kyc_status === 'NEEDS_MANUAL_REVIEW') ? 'secondary' :
                  'outline'
                } className={profile?.kyc_status === 'VERIFIED' ? 'bg-green-500 hover:bg-green-600' : ''}>
                  {profile?.kyc_status === 'VERIFIED' ? t("Verificat", "Verified") :
                   profile?.kyc_status === 'SUBMITTED' ? t("În curs de verificare", "Under review") :
                   profile?.kyc_status === 'NEEDS_MANUAL_REVIEW' ? t("În curs de verificare", "Under review") :
                   profile?.kyc_status === 'REJECTED' ? t("Respins", "Rejected") :
                   t("Neverificat", "Not verified")}
                </Badge>
              </div>

              {/* Level */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("Nivel verificare", "Verification level")}</span>
                <span className="text-sm text-muted-foreground">
                  {profile?.kyc_level === 'NONE' ? t("Niciunul", "None") : profile?.kyc_level?.replace('_', ' ')}
                </span>
              </div>

              {/* Status-specific content */}
              {profile?.kyc_status === 'VERIFIED' && (
                <div className="flex items-center gap-2 rounded-lg bg-green-100/50 dark:bg-green-900/20 p-3 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  {t("Identitatea ta a fost verificată cu succes. Bucură-te de toate funcționalitățile platformei!", "Your identity has been verified successfully. Enjoy all platform features!")}
                </div>
              )}

              {(profile?.kyc_status === 'SUBMITTED' || profile?.kyc_status === 'NEEDS_MANUAL_REVIEW') && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 p-3 text-sm text-amber-700 dark:text-amber-400">
                  <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />
                  {t("Documentele tale sunt în curs de verificare. Te vom notifica când procesul este finalizat.", "Your documents are being reviewed. We'll notify you when the process is complete.")}
                </div>
              )}

              {profile?.kyc_status === 'REJECTED' && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  {t("Verificarea a fost respinsă. Te rugăm să reîncarci documentele.", "Verification was rejected. Please re-upload your documents.")}
                </div>
              )}

              {(profile?.kyc_status === 'NOT_VERIFIED' || profile?.kyc_status === 'REJECTED') && (
                <Button className="w-full" onClick={() => navigate("/verificare")}>
                  <Shield className="mr-2 h-4 w-4" />
                  {profile?.kyc_status === 'REJECTED' 
                    ? t("Reîncepe verificarea", "Restart verification") 
                    : t("Începe verificarea", "Start verification")}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5" />
                {t("Schimbă parola", "Change password")}
              </CardTitle>
              <CardDescription>{t("Primește un email pentru a-ți reseta parola", "Receive an email to reset your password")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={handlePasswordReset} disabled={isResettingPassword}>
                {isResettingPassword ? t("Se trimite...", "Sending...") : t("Schimbă parola", "Change password")}
              </Button>
            </CardContent>
          </Card>

          {/* SMS Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5" />
                {ux.smsNotifications.title}
              </CardTitle>
              <CardDescription>{ux.smsNotifications.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {smsEnabled ? ux.smsNotifications.enabled : ux.smsNotifications.disabled}
                  </span>
                </div>
                <Switch
                  checked={smsEnabled && hasValidPhone}
                  disabled={!hasValidPhone || isSavingSms}
                  onCheckedChange={handleSmsToggle}
                  aria-label={ux.smsNotifications.title}
                />
              </div>
              {!hasValidPhone && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{ux.smsNotifications.missingPhone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deactivate Account */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                <Trash2 className="h-5 w-5" />
                {t("Dezactivare cont", "Deactivate account")}
              </CardTitle>
              <CardDescription>{t("Odată dezactivat, contul tău nu va mai fi accesibil", "Once deactivated, your account will no longer be accessible")}</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">{t("Dezactivează contul", "Deactivate account")}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("Ești sigur?", "Are you sure?")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t(
                        "Vei primi un email de confirmare. Contul va fi dezactivat doar după ce confirmi prin link-ul din email.",
                        "You will receive a confirmation email. Your account will only be deactivated after you confirm via the email link."
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("Anulează", "Cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeactivateAccount} disabled={isDeactivating}>
                      {isDeactivating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {t("Dezactivează", "Deactivate")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                {t("Metoda de plată", "Payment method")}
              </CardTitle>
              <CardDescription>{t("Adaugă un card pentru a putea face rezervări", "Add a card to make reservations")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <CreditCard className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">{t("Nicio metodă de plată adăugată", "No payment method added")}</p>
                <Button variant="outline">{t("Adaugă metodă de plată", "Add payment method")}</Button>
              </div>
            </CardContent>
          </Card>

          {/* Payout Settings (IBAN) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5" />
                {t("Cum primești banii?", "How do you receive payments?")}
              </CardTitle>
              <CardDescription>{t("Configurează IBAN-ul pentru retrageri", "Configure your IBAN for withdrawals")}</CardDescription>
            </CardHeader>
            <CardContent>
              <IbanForm userId={user?.id} profile={profile} onSaved={(iban, holder) => setProfile(prev => prev ? { ...prev, iban, account_holder_name: holder } as any : prev)} />
            </CardContent>
          </Card>

          {/* Secure Payments Info */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                {t("Plăți sigure", "Secure payments")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("Toate plățile sunt procesate în siguranță prin partenerii noștri de încredere. Datele tale bancare sunt criptate și protejate.", "All payments are securely processed through our trusted partners. Your banking data is encrypted and protected.")}
              </p>
            </CardContent>
          </Card>

          {/* Support Link */}
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <a href="/suport" className="block">
              <CardContent className="flex items-center gap-4 py-5">
                <div className="rounded-2xl bg-primary/10 p-3">
                  <LifeBuoy className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{t("Ai o problemă?", "Having an issue?")}</p>
                  <p className="text-xs text-muted-foreground">{t("Deschide un ticket de suport", "Open a support ticket")}</p>
                </div>
              </CardContent>
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AccountTab;
