import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CheckCircle2, AlertCircle, Lock, Wallet, Shield, Trash2, User, Phone, Mail,
  MessageCircle, Camera, Loader2, LifeBuoy, Bell, ChevronDown, Star, Calendar, Sparkles,
  ShieldCheck, KeyRound, History, BadgeCheck, ChevronRight, Landmark, Pencil, Plus, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { getProfile, updateProfile, createProfile, Profile } from "@/features/profile/profileApi";
import { getUserStatistics } from "@/features/profile/statisticsApi";
import { uploadAvatar } from "@/features/profile/avatarApi";
import { supabase } from "@/integrations/supabase/client";
import { useUxCopy } from "@/hooks/useUxCopy";
import { isValidRomanianPhone } from "@/lib/inputValidation";
import { showSaveToast } from "@/lib/saveToast";
import { useProfileRealtime } from "@/hooks/useProfileRealtime";
import { AvatarCropperDialog } from "@/components/profile/account/AvatarCropperDialog";
import PhoneOtpDialog from "@/components/profile/PhoneOtpDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/* ============================================================================
 *  SCHEMA
 * ========================================================================== */
const profileSchema = z.object({
  full_name: z.string().min(2, "Min 2 caractere").optional().or(z.literal("")),
  phone: z.string().regex(/^[+0-9() -]*$/, "Format invalid").max(20).optional().or(z.literal("")),
  email: z.string().email("Format email invalid").max(100).optional().or(z.literal("")),
});
type ProfileFormData = z.infer<typeof profileSchema>;

/* ============================================================================
 *  HELPERS
 * ========================================================================== */
const SECTIONS = [
  { id: "personal", labelRo: "Profil", labelEn: "Profile", icon: User },
  { id: "security", labelRo: "Securitate", labelEn: "Security", icon: Lock },
  { id: "payout", labelRo: "Încasări", labelEn: "Payouts", icon: Wallet },
  { id: "notifications", labelRo: "Notificări", labelEn: "Notifications", icon: Bell },
  { id: "support", labelRo: "Suport", labelEn: "Support", icon: LifeBuoy },
];

const scrollToSection = (id: string) => {
  const el = document.getElementById(`section-${id}`);
  if (el) {
    const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
};

const formatIbanMask = (raw: string) =>
  raw.toUpperCase().replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();

/* ============================================================================
 *  MAIN COMPONENT
 * ========================================================================== */
const AccountTab = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const ux = useUxCopy();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingSms, setIsSavingSms] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordResetSentOpen, setPasswordResetSentOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [pendingPhone, setPendingPhone] = useState<string>("");

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", phone: "", email: "" },
  });

  /* ---- statistics ---- */
  const { data: stats } = useQuery({
    queryKey: ["userStatistics", user?.id],
    queryFn: () => getUserStatistics(user!.id),
    enabled: !!user?.id,
  });

  /* ---- realtime sync of profile across devices / admin edits ---- */
  useProfileRealtime(user?.id, async () => {
    if (!user) return;
    try {
      const fresh = await getProfile(user.id);
      if (fresh) setProfile(fresh);
    } catch { /* ignore */ }
  });

  /* ---- load profile ---- */
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        let profileData = await getProfile(user.id);
        if (!profileData) {
          profileData = await createProfile(user.id, { full_name: user.user_metadata?.full_name || null });
        }
        setProfile(profileData);
        form.reset({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          email: profileData.email || "",
        });
      } catch (error) {
        console.error("Error loading profile:", error);
        toast({ title: t("Eroare", "Error"), description: t("Nu s-a putut încărca profilul", "Could not load profile"), variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [user, form, toast, t]);

  /* ---- scroll spy ---- */
  useEffect(() => {
    const onScroll = () => {
      let current = "personal";
      for (const s of SECTIONS) {
        const el = document.getElementById(`section-${s.id}`);
        if (el && el.getBoundingClientRect().top <= 150) current = s.id;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---- handle ?focus= deep-links from profile completion checklist ---- */
  useEffect(() => {
    if (isLoading) return;
    const focus = searchParams.get("focus");
    if (!focus) return;
    const sectionByFocus: Record<string, string> = {
      name: "personal",
      phone: "personal",
      avatar: "personal",
      iban: "payout",
    };
    const sectionId = sectionByFocus[focus];
    if (sectionId) {
      // Wait a tick for layout, then scroll and trigger action.
      setTimeout(() => {
        scrollToSection(sectionId);
        if (focus === "avatar") {
          fileInputRef.current?.click();
        }
      }, 150);
    }
    // Clean URL so refresh doesn't re-trigger
    const next = new URLSearchParams(searchParams);
    next.delete("focus");
    setSearchParams(next, { replace: true });
  }, [isLoading, searchParams, setSearchParams]);

  /* ---- derived values ---- */
  const phoneFieldValue = form.watch("phone");
  const hasValidPhone = isValidRomanianPhone(phoneFieldValue || profile?.phone || "");
  const smsEnabled = profile?.sms_notifications_enabled !== false;

  const completion = useMemo(() => {
    if (!profile) return { percent: 0, items: [] as Array<{ key: string; label: string; done: boolean; section: string }> };
    const items = [
      { key: "name", label: t("Nume complet", "Full name"), done: !!profile.full_name, section: "personal" },
      { key: "phone", label: t("Telefon valid", "Valid phone"), done: isValidRomanianPhone(profile.phone || ""), section: "personal" },
      { key: "avatar", label: t("Fotografie profil", "Profile photo"), done: !!profile.avatar_url, section: "personal" },
      { key: "iban", label: t("IBAN configurat", "IBAN set"), done: !!(profile as any).iban, section: "payout" },
    ];
    const done = items.filter((i) => i.done).length;
    return { percent: Math.round((done / items.length) * 100), items };
  }, [profile, t]);

  const trustScore = completion.percent;

  const memberSinceLabel = useMemo(() => {
    const src = (stats?.member_since || profile?.created_at) as string | undefined;
    if (!src) return null;
    const d = new Date(src);
    return d.toLocaleDateString(language === "ro" ? "ro-RO" : "en-GB", { month: "long", year: "numeric" });
  }, [stats, profile, language]);

  const initials = useMemo(() => {
    if (profile?.full_name) return profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return "U";
  }, [profile, user]);

  /* ---- handlers ---- */
  const handleAvatarChange = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t("Eroare", "Error"), description: t("Fișier prea mare (max 5MB)", "File too large (max 5MB)"), variant: "destructive" });
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const newUrl = await uploadAvatar(user.id, file);
      setProfile((p) => (p ? { ...p, avatar_url: newUrl } : p));
      await queryClient.invalidateQueries({ queryKey: ["currentUserProfile", user.id] });
      toast({ title: t("Succes", "Success"), description: t("Fotografia a fost actualizată", "Photo updated") });
      showSaveToast(t("Fotografie actualizată", "Photo updated"));
    } catch (e) {
      console.error(e);
      toast({ title: t("Eroare", "Error"), description: t("Nu s-a putut încărca fotografia", "Could not upload photo"), variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setCropperOpen(false);
      setPendingAvatar(null);
    }
  };

  const handleAvatarPicked = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: t("Eroare", "Error"), description: t("Fișier prea mare (max 10MB)", "File too large (max 10MB)"), variant: "destructive" });
      return;
    }
    setPendingAvatar(file);
    setCropperOpen(true);
  };

  const handleSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    if (data.phone && data.phone.trim() && !isValidRomanianPhone(data.phone)) {
      toast({ title: t("Telefon invalid", "Invalid phone"), description: ux.smsNotifications.invalidFormat, variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const normalizedPhone = data.phone ? data.phone.trim().replace(/\s+/g, " ") : "";
      const phoneChanged =
        !!normalizedPhone &&
        isValidRomanianPhone(normalizedPhone) &&
        normalizedPhone !== (profile?.phone || "");
      // Save everything EXCEPT phone when it changed — phone is gated by OTP.
      const updated = await updateProfile(user.id, {
        full_name: data.full_name || undefined,
        phone: phoneChanged ? undefined : (normalizedPhone || undefined),
        email: data.email || undefined,
      });
      // Detect changes to send security confirmation email (fire-and-forget)
      const changes: { label: string; value: string }[] = [];
      const prevName = (profile?.full_name || "").trim();
      const newName = (data.full_name || "").trim();
      if (newName && newName !== prevName) {
        changes.push({ label: "Nume complet", value: newName });
      }
      const prevEmail = (profile?.email || "").trim().toLowerCase();
      const newEmail = (data.email || "").trim().toLowerCase();
      if (newEmail && newEmail !== prevEmail) {
        changes.push({ label: "Email", value: newEmail });
      }
      // Phone change (when not OTP-gated, e.g. removed). OTP-gated phone change is sent in handlePhoneVerified.
      if (!phoneChanged && normalizedPhone !== (profile?.phone || "")) {
        changes.push({ label: "Telefon", value: normalizedPhone || "—" });
      }
      if (changes.length > 0 && (updated?.email || user.email)) {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "profile-updated",
            recipientEmail: updated?.email || user.email,
            idempotencyKey: `profile-updated-${user.id}-${Date.now()}`,
            templateData: { changes },
          },
        }).catch((e) => console.error("profile-updated email failed:", e));
      }
      setProfile(updated);
      await queryClient.invalidateQueries({ queryKey: ["currentUserProfile", user.id] });
      if (phoneChanged) {
        setPendingPhone(normalizedPhone);
        setOtpDialogOpen(true);
      } else {
        toast({ title: t("Salvat", "Saved"), description: t("Profil actualizat cu succes", "Profile updated") });
        // Per-field confirmation pill
        if (changes.some((c) => c.label === "Nume complet")) {
          showSaveToast(t("Nume actualizat", "Name updated"));
        } else if (changes.some((c) => c.label === "Email")) {
          showSaveToast(t("Email actualizat", "Email updated"));
        } else if (changes.some((c) => c.label === "Telefon")) {
          showSaveToast(t("Telefon actualizat", "Phone updated"));
        } else {
          showSaveToast(t("Profil actualizat", "Profile updated"));
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: t("Eroare", "Error"), description: t("Nu s-a putut actualiza profilul", "Could not update"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhoneVerified = async (verifiedPhone: string) => {
    if (!user) return;
    try { await supabase.auth.updateUser({ data: { phone: verifiedPhone } }); } catch {}
    try {
      const fresh = await getProfile(user.id);
      if (fresh) setProfile(fresh);
    } catch { /* ignore */ }
    await queryClient.invalidateQueries({ queryKey: ["currentUserProfile", user.id] });
    // Fire-and-forget security email for phone change
    if (user.email) {
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "profile-updated",
          recipientEmail: user.email,
          idempotencyKey: `profile-updated-${user.id}-phone-${Date.now()}`,
          templateData: { changes: [{ label: "Telefon", value: verifiedPhone }] },
        },
      }).catch((e) => console.error("profile-updated email failed:", e));
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsResettingPassword(true);
    try {
      await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/auth` });
      setPasswordResetSentOpen(true);
    } catch (e) {
      toast({ title: t("Eroare", "Error"), description: t("Nu s-a putut trimite emailul", "Could not send email"), variant: "destructive" });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSmsToggle = async (next: boolean) => {
    if (!user) return;
    setIsSavingSms(true);
    try {
      const updated = await updateProfile(user.id, { sms_notifications_enabled: next });
      setProfile(updated);
      toast({ title: t("Salvat", "Saved"), description: ux.smsNotifications.saved });
      showSaveToast(next ? t("Notificări SMS activate", "SMS notifications on") : t("Notificări SMS dezactivate", "SMS notifications off"));
    } catch {
      toast({ title: t("Eroare", "Error"), description: ux.smsNotifications.saveError, variant: "destructive" });
    } finally {
      setIsSavingSms(false);
    }
  };

  const handleDeactivateAccount = async () => {
    setIsDeactivating(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-account-deactivation");
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: t("Email trimis", "Email sent"), description: t("Verifică-ți emailul pentru a confirma dezactivarea contului.", "Check your email to confirm deactivation.") });
    } catch (e) {
      console.error(e);
      toast({ title: t("Eroare", "Error"), description: t("Nu s-a putut trimite cererea", "Could not send request"), variant: "destructive" });
    } finally {
      setIsDeactivating(false);
    }
  };

  /* ---- loading ---- */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-8 pb-20 lg:pb-8">

        {/* ============ STICKY SECTION NAV ============ */}
        <div className="sticky top-16 lg:top-2 z-30 -mx-4 px-4 lg:mx-0 lg:px-0 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 py-2 border-b border-border/60">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    active ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{language === "ro" ? s.labelRo : s.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============ PERSONAL INFORMATION ============ */}
        <Section id="personal" icon={User} title={t("Informații personale", "Personal information")} description={t("Datele tale de bază. Sunt folosite pentru a comunica cu ceilalți utilizatori.", "Your basic info, used to communicate with other users.")}>
          {/* Compact avatar + identity row (full hero lives on /profile) */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="relative">
              <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarPicked(f); }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                aria-label={t("Schimbă fotografia", "Change photo")}
              >
                {isUploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold truncate">{profile?.full_name || t("Utilizator nou", "New user")}</p>
              </div>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label={t("Email cont", "Account email")} icon={<Mail className="h-4 w-4" />} hint={t("Emailul nu poate fi modificat", "Email cannot be changed")}>
                <Input value={user?.email || ""} disabled className="bg-muted" />
              </Field>
              <Field label={t("Nume complet", "Full name")} icon={<User className="h-4 w-4" />} error={form.formState.errors.full_name?.message}>
                <Input placeholder="Ion Popescu" {...form.register("full_name")} />
              </Field>
              <Field label={t("Telefon", "Phone")} icon={<Phone className="h-4 w-4" />} error={form.formState.errors.phone?.message}>
                <Input type="tel" placeholder="+40 7XX XXX XXX" maxLength={20} {...form.register("phone")} />
              </Field>
            </div>

            {/* Sticky save bar on mobile */}
            <div className="hidden lg:flex justify-end">
              <Button type="submit" disabled={isSaving} className="min-w-[180px]">
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("Se salvează...", "Saving...")}</> : t("Salvează modificările", "Save changes")}
              </Button>
            </div>
            <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 px-4 py-3 bg-background/95 backdrop-blur border-t border-border">
              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("Se salvează...", "Saving...")}</> : t("Salvează modificările", "Save changes")}
              </Button>
            </div>
          </form>
        </Section>

        {/* ============ SECURITY ============ */}
        <Section id="security" icon={Lock} title={t("Centru securitate", "Security center")} description={t("Gestionează parola, autentificarea și sesiunile contului.", "Manage your password, authentication and account sessions.")}>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Password */}
            <SecurityCard
              icon={KeyRound}
              title={t("Parolă", "Password")}
              description={t("Primește un email pentru resetarea parolei.", "Receive an email to reset your password.")}
              action={
                <Button variant="outline" size="sm" onClick={handlePasswordReset} disabled={isResettingPassword}>
                  {isResettingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Schimbă parola", "Change password")}
                </Button>
              }
            />
            {/* Last sign in */}
            <SecurityCard
              icon={History}
              title={t("Ultima conectare", "Last sign-in")}
              description={
                user?.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleString(language === "ro" ? "ro-RO" : "en-GB")
                  : "—"
              }
            />
          </div>

          <AlertDialog open={passwordResetSentOpen} onOpenChange={setPasswordResetSentOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("Email trimis", "Email sent")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t(
                    `Ți-am trimis un email la ${user?.email ?? ""} cu un link pentru resetarea parolei. Verifică inbox-ul (și folderul Spam).`,
                    `We sent an email to ${user?.email ?? ""} with a link to reset your password. Check your inbox (and Spam folder).`
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>{t("Am înțeles", "Got it")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Section>

        {/* ============ PAYOUT (IBAN) ============ */}
        <Section id="payout" icon={Wallet} title={t("Cum primești banii", "How you get paid")} description={t("Adaugă IBAN-ul în care vei primi banii din închirieri.", "Add the IBAN where you'll receive rental payouts.")}>
          <PayoutIbansSection
            userId={user?.id}
            profile={profile}
            onDefaultChanged={(iban, holder) => setProfile((p) => (p ? ({ ...p, iban, account_holder_name: holder } as any) : p))}
          />
        </Section>

        {/* ============ NOTIFICATIONS ============ */}
        <Section id="notifications" icon={Bell} title={t("Centru notificări", "Notification center")} description={t("Alege cum vrei să fii anunțat.", "Choose how you want to be notified.")}>
          <div className="space-y-3">
            <NotificationToggle
              title={ux.smsNotifications.title}
              description={smsEnabled ? ux.smsNotifications.enabled : ux.smsNotifications.disabled}
              checked={smsEnabled && hasValidPhone}
              disabled={!hasValidPhone || isSavingSms}
              onChange={handleSmsToggle}
              warning={!hasValidPhone ? ux.smsNotifications.missingPhone : undefined}
            />
            <NotificationToggle
              title={t("Email — actualizări închirieri", "Email — rental updates")}
              description={t("Primești emailuri pentru cereri, acceptări și predări.", "You receive emails for requests, approvals and handovers.")}
              checked={true}
              disabled
              comingSoon
            />
            <NotificationToggle
              title={t("Email — chat & mesaje", "Email — chat & messages")}
              description={t("Notificare când primești un mesaj nou.", "Notify me when I receive a new message.")}
              checked={true}
              disabled
              comingSoon
            />
            <NotificationToggle
              title={t("Marketing & noutăți", "Marketing & news")}
              description={t("Oferte, ghiduri și anunțuri importante.", "Offers, guides and important announcements.")}
              checked={false}
              disabled
              comingSoon
            />
            <Link
              to="/setari/notificari"
              className="group flex items-center gap-3 rounded-xl border border-border p-4 hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{t("Setări avansate notificări", "Advanced notification settings")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("Personalizează ce notificări primești și pe ce canale.", "Customize which notifications you receive and on which channels.")}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </Section>

        {/* ============ SUPPORT ============ */}
        <Section id="support" icon={LifeBuoy} title={t("Suport & siguranță", "Support & safety")} description={t("Suntem aici dacă ai nevoie de ajutor.", "We're here if you need help.")}>
          <div className="grid sm:grid-cols-2 gap-3">
            <SupportLink to="/suport" icon={MessageCircle} title={t("Tichetele mele", "My tickets")} description={t("Vezi conversațiile cu suportul", "View support conversations")} />
            <SupportLink to="/cum-functioneaza" icon={Shield} title={t("Cum funcționează", "How it works")} description={t("Procesul de închiriere pas cu pas", "The rental process step by step")} />
            <SupportLink to="/termeni-si-conditii" icon={BadgeCheck} title={t("Termeni & condiții", "Terms & conditions")} description={t("Politicile platformei", "Platform policies")} />
          </div>
        </Section>

        {/* ============ DANGER ZONE ============ */}
        <Collapsible>
          <Card className="border-destructive/20">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-5 text-left group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-semibold">{t("Dezactivează contul", "Deactivate account")}</p>
                  </div>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t border-border px-5 py-5">
                <div className="space-y-4">
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm space-y-2">
                    <p className="font-semibold text-destructive">
                      {t("Atenție — această acțiune are consecințe importante", "Warning — this action has important consequences")}
                    </p>
                    <p className="text-foreground/80">
                      {t(
                        "Dezactivarea contului tău va avea următoarele efecte:",
                        "Deactivating your account will have the following effects:"
                      )}
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-foreground/80">
                      <li>{t("Profilul tău și toate anunțurile vor fi ascunse imediat de pe platformă.", "Your profile and all listings will be immediately hidden from the platform.")}</li>
                      <li>{t("Nu vei mai putea primi rezervări, mesaje sau notificări.", "You will no longer receive bookings, messages or notifications.")}</li>
                      <li>{t("Rezervările active trebuie finalizate înainte de dezactivare.", "Active rentals must be completed before deactivation.")}</li>
                      <li>{t("Soldul disponibil trebuie retras în prealabil — după dezactivare nu mai poți face retrageri.", "Any available balance must be withdrawn beforehand — after deactivation withdrawals are no longer possible.")}</li>
                      <li>{t("Vei fi delogat automat și nu te vei mai putea autentifica.", "You will be logged out automatically and will no longer be able to sign in.")}</li>
                      <li>{t("Poți reactiva contul contactând echipa de suport în 30 de zile; după această perioadă datele pot fi șterse definitiv.", "You can reactivate your account by contacting support within 30 days; after this period data may be permanently deleted.")}</li>
                    </ul>
                    <p className="text-foreground/70">
                      {t(
                        "Vei primi un email de confirmare — contul nu se dezactivează până nu apeși link-ul din email (valabil 24 de ore).",
                        "You will receive a confirmation email — the account is not deactivated until you click the link in the email (valid for 24 hours)."
                      )}
                    </p>
                  </div>
                  <div className="flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">{t("Dezactivează contul", "Deactivate account")}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("Ești sigur?", "Are you sure?")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("Vei primi un email de confirmare. Contul va fi dezactivat doar după ce confirmi prin link-ul din email.", "You will receive a confirmation email. Your account will only be deactivated after you confirm via the email link.")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("Anulează", "Cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeactivateAccount} disabled={isDeactivating}>
                          {isDeactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {t("Dezactivează", "Deactivate")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      <AvatarCropperDialog
        file={pendingAvatar}
        open={cropperOpen}
        onOpenChange={(o) => { setCropperOpen(o); if (!o) setPendingAvatar(null); }}
        saving={isUploadingAvatar}
        onConfirm={handleAvatarChange}
      />
      <PhoneOtpDialog
        open={otpDialogOpen}
        phone={pendingPhone}
        onOpenChange={setOtpDialogOpen}
        onVerified={handlePhoneVerified}
      />
    </TooltipProvider>
  );
};

/* ============================================================================
 *  SUB-COMPONENTS
 * ========================================================================== */

const Section = ({
  id, icon: Icon, title, description, children,
}: {
  id: string; icon: any; title: string; description: string; children: React.ReactNode;
}) => (
  <motion.section
    id={`section-${id}`}
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.35 }}
    className="scroll-mt-28"
  >
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-0.5">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  </motion.section>
);

const Field = ({
  label, icon, hint, error, children,
}: {
  label: string; icon?: React.ReactNode; hint?: string; error?: string; children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <Label className="flex items-center gap-2 text-sm">{icon}{label}</Label>
    {children}
    {error ? (
      <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>
    ) : hint ? (
      <p className="text-xs text-muted-foreground">{hint}</p>
    ) : null}
  </div>
);

const StatPill = ({ icon, label, value, sublabel }: { icon: React.ReactNode; label: string; value: string; sublabel?: string }) => (
  <div className="rounded-xl border border-border bg-background/80 px-3 py-2.5">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
      {icon}<span className="truncate">{label}</span>
    </div>
    <p className="text-lg font-bold tabular-nums leading-tight">{value}</p>
    {sublabel && <p className="text-[10px] text-muted-foreground truncate">{sublabel}</p>}
  </div>
);

const SecurityCard = ({ icon: Icon, title, description, action }: { icon: any; title: string; description: string; action?: React.ReactNode }) => (
  <div className="rounded-xl border border-border p-4 flex flex-col gap-3 bg-background hover:border-primary/30 transition-colors">
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
    {action && <div className="flex justify-end">{action}</div>}
  </div>
);

const ComingSoonCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="rounded-xl border border-dashed border-border p-4 bg-muted/20 relative">
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-2xl bg-background flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{title}</p>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">soon</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  </div>
);

const NotificationToggle = ({
  title, description, checked, onChange, disabled, warning, comingSoon,
}: {
  title: string; description: string; checked: boolean; onChange?: (next: boolean) => void;
  disabled?: boolean; warning?: string; comingSoon?: boolean;
}) => (
  <div className="rounded-xl border border-border p-4 bg-background">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{title}</p>
          {comingSoon && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">soon</Badge>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
    {warning && (
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-2.5 text-xs text-amber-800 dark:text-amber-300">
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
        <span>{warning}</span>
      </div>
    )}
  </div>
);

const SupportLink = ({ to, icon: Icon, title, description }: { to: string; icon: any; title: string; description: string }) => (
  <Link to={to} className="group flex items-center gap-3 rounded-xl border border-border p-4 hover:border-primary/40 hover:bg-primary/5 transition-all">
    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
  </Link>
);

type PayoutIban = {
  id: string;
  iban: string;
  account_holder_name: string;
  is_default: boolean;
  created_at: string;
};

const MAX_IBANS = 3;

const maskIbanFull = (raw: string) => {
  const clean = (raw || "").replace(/\s/g, "");
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 4)} •••• •••• •••• ${clean.slice(-4)}`;
};

function PayoutIbansSection({
  userId,
  profile,
  onDefaultChanged,
}: {
  userId?: string;
  profile: any;
  onDefaultChanged: (iban: string, holder: string) => void;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const fullName = ((profile as any)?.full_name || "").trim();

  const [ibans, setIbans] = useState<PayoutIban[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newIban, setNewIban] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const ibanRegex = /^RO[0-9]{2}[A-Z0-9]{20}$/;

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("payout_ibans")
      .select("id, iban, account_holder_name, is_default, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (!error && data) setIbans(data as PayoutIban[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [userId]);

  // Open the inline form automatically if user has no IBAN yet
  useEffect(() => {
    if (!loading && ibans.length === 0) setAdding(true);
  }, [loading, ibans.length]);

  const syncDefaultToParent = (list: PayoutIban[]) => {
    const def = list.find((x) => x.is_default);
    if (def) onDefaultChanged(def.iban, def.account_holder_name);
  };

  const handleAdd = async () => {
    setFormError(null);
    if (!userId) { setFormError(t("Sesiunea a expirat. Autentifică-te din nou.", "Session expired. Please sign in again.")); return; }
    const clean = newIban.toUpperCase().replace(/\s/g, "");
    if (!ibanRegex.test(clean)) {
      setFormError(t("IBAN invalid. Verifică formatul (RO + 22 caractere).", "Invalid IBAN. Check the format (RO + 22 chars)."));
      return;
    }
    // Read the latest name from the database (profile prop may be stale)
    let holder = fullName;
    const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
    if (prof?.full_name?.trim()) holder = prof.full_name.trim();
    if (!holder || holder.length < 3) {
      setFormError(t("Completează mai întâi numele complet în secțiunea Profil.", "Please fill in your full name in the Profile section first."));
      return;
    }
    if (ibans.length >= MAX_IBANS) {
      setFormError(t("Poți avea maxim 3 IBAN-uri salvate.", "You can save up to 3 IBANs."));
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("payout_ibans")
        .insert({ user_id: userId, iban: clean, account_holder_name: holder, is_default: ibans.length === 0 } as any);
      if (error) throw error;
      setNewIban("");
      setAdding(false);
      await load();
    } catch (e: any) {
      const msg = e?.message || "";
      setFormError(msg.includes("duplicate")
        ? t("IBAN-ul este deja salvat.", "This IBAN is already saved.")
        : msg || t("Nu s-a putut salva IBAN-ul.", "Could not save IBAN."));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!userId) return;
    setBusyId(id);
    try {
      const { error } = await supabase
        .from("payout_ibans")
        .update({ is_default: true } as any)
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
      const next = ibans.map((x) => ({ ...x, is_default: x.id === id }));
      setIbans(next);
      syncDefaultToParent(next);
      toast({ title: t("Implicit actualizat", "Default updated") });
    } catch (e: any) {
      toast({ title: t("Eroare", "Error"), description: e?.message || "", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      const { error } = await supabase.rpc("delete_payout_iban", { p_id: id } as any);
      if (error) throw error;
      toast({ title: t("Șters", "Deleted") });
      await load();
    } catch (e: any) {
      toast({ title: t("Nu se poate șterge", "Cannot delete"), description: e?.message || "", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const canAddMore = ibans.length < MAX_IBANS;

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("Se încarcă...", "Loading...")}
        </div>
      )}

      {/* IBAN cards */}
      {!loading && ibans.map((row) => (
        <div key={row.id} className="flex items-start sm:items-center gap-4 rounded-xl border bg-muted/30 p-4 flex-col sm:flex-row">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-semibold">IBAN</span>
              {row.is_default && (
                <Badge variant="secondary" className="text-[10px] h-5">{t("Implicit", "Default")}</Badge>
              )}
            </div>
            <p className="font-mono text-sm tracking-wide truncate">{maskIbanFull(row.iban)}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{row.account_holder_name}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {!row.is_default && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSetDefault(row.id)}
                disabled={busyId === row.id}
                className="flex-1 sm:flex-none"
              >
                {busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5 mr-1.5" />}
                {t("Setează implicit", "Set as default")}
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={busyId === row.id} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("Șterge acest IBAN?", "Delete this IBAN?")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(
                      "Dacă există o cerere de retragere în așteptare pe acest IBAN, ștergerea va fi blocată.",
                      "If there is a pending withdrawal on this IBAN, deletion will be blocked."
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("Anulează", "Cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(row.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t("Șterge", "Delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}

      {/* Add new IBAN form */}
      {!loading && adding && canAddMore && (
        <div className="space-y-3 rounded-xl border border-dashed bg-background p-4">
          <div className="space-y-2">
            <Label htmlFor="new-iban" className="text-sm">
              {ibans.length === 0 ? t("IBAN", "IBAN") : t("IBAN suplimentar", "Additional IBAN")}
            </Label>
            <Input
              id="new-iban"
              value={formatIbanMask(newIban)}
              onChange={(e) => { setFormError(null); setNewIban(e.target.value.toUpperCase().replace(/\s/g, "")); }}
              placeholder="RO49 AAAA 1B31 0075 9384 0000"
              maxLength={42}
              className="font-mono tracking-wider"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <User className="h-3.5 w-3.5 shrink-0" />
              {fullName ? (
                <span className="truncate">
                  {t("Titular cont:", "Account holder:")}{" "}
                  <span className="font-medium text-foreground">{fullName}</span>
                  <span className="ml-1">— {t("același nume pe toate IBAN-urile", "same name on all IBANs")}</span>
                </span>
              ) : (
                <button type="button" onClick={() => scrollToSection("personal")} className="text-primary hover:underline">
                  {t("Completează numele complet în Profil", "Fill in your full name in Profile")}
                </button>
              )}
            </div>
          </div>
          {formError && (
            <p role="alert" className="text-sm text-destructive">{formError}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleAdd} disabled={saving || !newIban} className="w-full sm:w-auto">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("Se salvează...", "Saving...")}</> : t("Salvează IBAN", "Save IBAN")}
            </Button>
            {ibans.length > 0 && (
              <Button variant="ghost" onClick={() => { setAdding(false); setNewIban(""); }} className="w-full sm:w-auto">
                {t("Anulează", "Cancel")}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* "Add another IBAN" button */}
      {!loading && !adding && canAddMore && ibans.length > 0 && (
        <Button variant="outline" onClick={() => setAdding(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-1.5" />
          {t("Adaugă alt IBAN", "Add another IBAN")}
          <span className="ml-2 text-xs text-muted-foreground">({ibans.length}/{MAX_IBANS})</span>
        </Button>
      )}

      {!loading && !canAddMore && (
        <p className="text-xs text-muted-foreground">
          {t("Ai atins limita de 3 IBAN-uri. Șterge unul pentru a adăuga altul.", "You've reached the limit of 3 IBANs. Delete one to add another.")}
        </p>
      )}

      {/* Security notice */}
      {!loading && ibans.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-muted/40 border border-border px-3 py-2.5 text-xs text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0 mt-0.5 text-foreground/70" />
          <span>
            {t(
              "Toate IBAN-urile trebuie să fie pe numele tău complet din profil. Pentru schimbarea numelui titular, deschide un tichet de suport.",
              "All IBANs must be in your full name from the profile. To change the account holder name, open a support ticket."
            )}
          </span>
        </div>
      )}

      {!loading && ibans.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          {t("IBAN configurat — ești gata să primești plăți.", "IBAN set — you're ready to receive payouts.")}
        </div>
      )}
    </div>
  );
};

export default AccountTab;
