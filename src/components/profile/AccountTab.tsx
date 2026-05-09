import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  CheckCircle2, AlertCircle, Lock, CreditCard, Wallet, Shield, Trash2, User, Phone, Mail,
  MessageCircle, Camera, Loader2, LifeBuoy, Bell, ChevronDown, Star, Calendar, Sparkles,
  ShieldCheck, KeyRound, Smartphone, History, Globe, BadgeCheck, ChevronRight,
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
import { useProfileRealtime } from "@/hooks/useProfileRealtime";
import { TrustScoreRing } from "@/components/profile/account/TrustScoreRing";
import { AvatarCropperDialog } from "@/components/profile/account/AvatarCropperDialog";
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
  whatsapp: z.string().regex(/^[+0-9() -]*$/, "Format invalid").max(20).optional().or(z.literal("")),
});
type ProfileFormData = z.infer<typeof profileSchema>;

/* ============================================================================
 *  HELPERS
 * ========================================================================== */
const SECTIONS = [
  { id: "personal", labelRo: "Profil", labelEn: "Profile", icon: User },
  { id: "verification", labelRo: "Verificare", labelEn: "Verification", icon: ShieldCheck },
  { id: "security", labelRo: "Securitate", labelEn: "Security", icon: Lock },
  { id: "payments", labelRo: "Plăți", labelEn: "Payments", icon: CreditCard },
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

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingSms, setIsSavingSms] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", phone: "", email: "", whatsapp: "" },
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
          whatsapp: profileData.whatsapp || "",
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
      { key: "kyc", label: t("Identitate verificată", "Identity verified"), done: profile.kyc_status === "VERIFIED", section: "verification" },
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
      const updated = await updateProfile(user.id, {
        full_name: data.full_name || undefined,
        phone: normalizedPhone || undefined,
        email: data.email || undefined,
        whatsapp: data.whatsapp || undefined,
      });
      setProfile(updated);
      if (normalizedPhone && isValidRomanianPhone(normalizedPhone)) {
        try { await supabase.auth.updateUser({ data: { phone: normalizedPhone } }); } catch {}
      }
      await queryClient.invalidateQueries({ queryKey: ["currentUserProfile", user.id] });
      toast({ title: t("Salvat", "Saved"), description: t("Profil actualizat cu succes", "Profile updated") });
    } catch (e) {
      console.error(e);
      toast({ title: t("Eroare", "Error"), description: t("Nu s-a putut actualiza profilul", "Could not update"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsResettingPassword(true);
    try {
      await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/auth` });
      toast({ title: t("Email trimis", "Email sent"), description: t("Verifică emailul pentru linkul de resetare.", "Check your email for the reset link.") });
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

  /* ---- KYC presentation ---- */
  const kycStatus = profile?.kyc_status || "NOT_VERIFIED";
  const kycMeta =
    kycStatus === "VERIFIED" ? { label: t("Identitate verificată", "Identity verified"), tone: "success" as const } :
    kycStatus === "SUBMITTED" || kycStatus === "NEEDS_MANUAL_REVIEW" ? { label: t("În curs de verificare", "Under review"), tone: "pending" as const } :
    kycStatus === "REJECTED" ? { label: t("Verificare respinsă", "Verification rejected"), tone: "danger" as const } :
    { label: t("Verificare necesară", "Verification required"), tone: "neutral" as const };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-8 pb-20 lg:pb-8">

        {/* ============ HERO CARD ============ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="relative">
              {/* Gradient banner */}
              <div className="h-32 bg-gradient-to-br from-[#F59E0B] via-[#F98715] to-[#FB923C] relative overflow-hidden">
                <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-white/10 blur-xl" />
              </div>
              <div className="px-6 sm:px-8 pb-6 -mt-14">
                <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="rounded-full p-[3px] bg-gradient-to-br from-[#F59E0B] via-[#F98715] to-[#FB923C] shadow-xl w-fit">
                      <Avatar className="h-24 w-24 sm:h-28 sm:w-28 ring-4 ring-background">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                    </div>
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
                      className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                      aria-label={t("Schimbă fotografia", "Change photo")}
                    >
                      {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Identity */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-2xl font-bold tracking-tight truncate">
                        {profile?.full_name || t("Utilizator nou", "New user")}
                      </h2>
                      {kycStatus === "VERIFIED" && (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1">
                          <BadgeCheck className="h-3.5 w-3.5" /> {t("Verificat", "Verified")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                    {memberSinceLabel && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {t("Membru din", "Member since")} {memberSinceLabel}
                      </p>
                    )}
                  </div>
                </div>

                {/* Trust ring + stats */}
                <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-6 mt-6 items-center">
                  <div className="flex justify-center sm:justify-start">
                    <TrustScoreRing
                      value={trustScore}
                      label={t("Trust", "Trust")}
                      sublabel={
                        trustScore >= 80 ? t("Excelent", "Excellent") :
                        trustScore >= 50 ? t("Bun", "Good") :
                        t("În progres", "In progress")
                      }
                    />
                  </div>
                  <motion.div
                    className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
                  >
                    {[
                      { icon: <Star className="h-4 w-4 fill-current text-amber-500" />, label: t("Rating", "Rating"),
                        value: stats?.average_rating ? stats.average_rating.toFixed(1) : "—",
                        sublabel: stats?.reviews_count ? `${stats.reviews_count} ${t("recenzii", "reviews")}` : undefined },
                      { icon: <ShieldCheck className="h-4 w-4 text-primary" />, label: t("Anunțuri", "Listings"),
                        value: String(stats?.products_count ?? 0) },
                      { icon: <Calendar className="h-4 w-4 text-muted-foreground" />, label: t("Membru din", "Member since"),
                        value: memberSinceLabel || "—" },
                    ].map((p, i) => (
                      <motion.div
                        key={i}
                        variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                      >
                        <StatPill icon={p.icon} label={p.label} value={p.value} sublabel={p.sublabel} />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ============ PROFILE COMPLETION ============ */}
        {trustScore < 100 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {t("Completează-ți profilul", "Complete your profile")}
                    </CardTitle>
                    <CardDescription>
                      {t("Un profil complet inspiră încredere și deblochează mai multe oportunități.", "A complete profile builds trust and unlocks more opportunities.")}
                    </CardDescription>
                  </div>
                  <div className="text-2xl font-bold text-primary tabular-nums">{trustScore}%</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={trustScore} className="h-2" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {completion.items.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => scrollToSection(item.section)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg text-left text-sm border transition-all hover:border-primary/40 hover:bg-primary/5 ${
                        item.done ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-900/40" : "border-border bg-background"
                      }`}
                    >
                      {item.done ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-amber-500 flex-shrink-0" />
                      )}
                      <span className={`flex-1 truncate ${item.done ? "text-muted-foreground" : "font-medium"}`}>{item.label}</span>
                      {!item.done && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

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
              <Field label={t("Email contact (public)", "Contact email (public)")} icon={<Mail className="h-4 w-4" />} error={form.formState.errors.email?.message}>
                <Input type="email" placeholder="contact@exemplu.ro" maxLength={100} {...form.register("email")} />
              </Field>
              <Field label="WhatsApp" icon={<MessageCircle className="h-4 w-4" />} error={form.formState.errors.whatsapp?.message}>
                <Input type="tel" placeholder="+40 7XX XXX XXX" maxLength={20} {...form.register("whatsapp")} />
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

        {/* ============ VERIFICATION ============ */}
        <Section id="verification" icon={ShieldCheck} title={t("Centru verificare", "Verification center")} description={t("Verifică-ți identitatea pentru a inspira încredere și a debloca închirieri premium.", "Verify your identity to build trust and unlock premium rentals.")}>
          <div className="rounded-xl border border-border p-5 bg-gradient-to-br from-background to-muted/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                  kycMeta.tone === "success" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" :
                  kycMeta.tone === "pending" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 animate-pulse" :
                  kycMeta.tone === "danger" ? "bg-destructive/10 text-destructive" :
                  "bg-muted text-muted-foreground"
                }`}>
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">{kycMeta.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {kycMeta.tone === "success" ? t("Ai acces complet la platformă", "You have full platform access") :
                     kycMeta.tone === "pending" ? t("Te vom anunța prin email când e gata", "We'll notify you by email when it's ready") :
                     t("Necesar pentru închirieri și retrageri de bani", "Required for rentals and withdrawals")}
                  </p>
                </div>
              </div>
              {kycStatus !== "VERIFIED" && kycStatus !== "SUBMITTED" && kycStatus !== "NEEDS_MANUAL_REVIEW" && (
                <Button onClick={() => navigate("/verificare")} className="sm:w-auto w-full">
                  <Shield className="mr-2 h-4 w-4" />
                  {kycStatus === "REJECTED" ? t("Reîncepe verificarea", "Restart verification") : t("Începe verificarea", "Start verification")}
                </Button>
              )}
            </div>

            {/* Mini stepper */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: t("Date personale", "Personal data"), done: kycStatus !== "NOT_VERIFIED" },
                { label: t("Documente", "Documents"), done: kycStatus === "SUBMITTED" || kycStatus === "NEEDS_MANUAL_REVIEW" || kycStatus === "VERIFIED" },
                { label: t("Aprobat", "Approved"), done: kycStatus === "VERIFIED" },
              ].map((step, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className={`h-1.5 rounded-full ${step.done ? "bg-emerald-500" : "bg-muted"}`} />
                  <p className="text-xs text-muted-foreground">{step.label}</p>
                </div>
              ))}
            </div>
          </div>
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
            {/* Coming soon */}
            <ComingSoonCard icon={Smartphone} title={t("Autentificare în 2 pași (2FA)", "Two-factor auth (2FA)")} description={t("Strat suplimentar de protecție via SMS sau aplicație.", "Extra protection via SMS or authenticator app.")} />
            <ComingSoonCard icon={Globe} title={t("Sesiuni active & dispozitive", "Active sessions & devices")} description={t("Vezi unde ești conectat și deconectează dispozitive.", "See where you're signed in and revoke devices.")} />
          </div>
        </Section>

        {/* ============ PAYMENT METHODS (placeholder) ============ */}
        <Section id="payments" icon={CreditCard} title={t("Metode de plată", "Payment methods")} description={t("Carduri salvate pentru rezervări rapide.", "Saved cards for fast bookings.")}>
          <div className="rounded-xl border border-dashed border-border p-8 text-center bg-muted/20">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <CreditCard className="h-7 w-7 text-primary" />
            </div>
            <p className="font-medium mb-1">{t("Niciun card salvat", "No saved cards")}</p>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              {t("La checkout poți plăti în siguranță cu cardul. Salvarea cardurilor pentru plăți rapide va fi disponibilă în curând.", "At checkout you can pay securely by card. Saved cards for one-tap payments coming soon.")}
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Button variant="outline" disabled>{t("Adaugă card", "Add card")}</Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{t("Disponibil curând", "Coming soon")}</TooltipContent>
            </Tooltip>
          </div>
        </Section>

        {/* ============ PAYOUT (IBAN) ============ */}
        <Section id="payout" icon={Wallet} title={t("Cum primești banii", "How you get paid")} description={t("Acest IBAN este folosit pentru retragerile din închirierile tale.", "This IBAN is used for withdrawals from your rentals.")}>
          <PayoutForm
            userId={user?.id}
            profile={profile}
            onSaved={(iban, holder) => setProfile((p) => (p ? ({ ...p, iban, account_holder_name: holder } as any) : p))}
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
          </div>
        </Section>

        {/* ============ SUPPORT ============ */}
        <Section id="support" icon={LifeBuoy} title={t("Suport & siguranță", "Support & safety")} description={t("Suntem aici dacă ai nevoie de ajutor.", "We're here if you need help.")}>
          <div className="grid sm:grid-cols-2 gap-3">
            <SupportLink href="/suport" icon={LifeBuoy} title={t("Centru suport", "Support center")} description={t("Răspunsuri rapide și ghiduri", "Quick answers and guides")} />
            <SupportLink href="/tichete" icon={MessageCircle} title={t("Tichetele mele", "My tickets")} description={t("Vezi conversațiile cu suportul", "View support conversations")} />
            <SupportLink href="/cum-functioneaza" icon={Shield} title={t("Cum funcționează", "How it works")} description={t("Procesul de închiriere pas cu pas", "The rental process step by step")} />
            <SupportLink href="/termeni-conditii" icon={BadgeCheck} title={t("Termeni & condiții", "Terms & conditions")} description={t("Politicile platformei", "Platform policies")} />
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
                    <p className="font-semibold">{t("Zonă sensibilă", "Danger zone")}</p>
                    <p className="text-xs text-muted-foreground">{t("Acțiuni ireversibile asupra contului.", "Irreversible account actions.")}</p>
                  </div>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t border-border px-5 py-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{t("Dezactivează contul", "Deactivate account")}</p>
                    <p className="text-xs text-muted-foreground">{t("Vei primi un email pentru a confirma dezactivarea.", "You'll receive an email to confirm deactivation.")}</p>
                  </div>
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

const SupportLink = ({ href, icon: Icon, title, description }: { href: string; icon: any; title: string; description: string }) => (
  <a href={href} className="group flex items-center gap-3 rounded-xl border border-border p-4 hover:border-primary/40 hover:bg-primary/5 transition-all">
    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
  </a>
);

const PayoutForm = ({ userId, profile, onSaved }: { userId?: string; profile: any; onSaved: (iban: string, holder: string) => void }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [iban, setIban] = useState((profile as any)?.iban || "");
  const [holder, setHolder] = useState((profile as any)?.account_holder_name || "");
  const [saving, setSaving] = useState(false);
  const hasIban = !!(profile as any)?.iban;

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const cleanIban = iban.toUpperCase().replace(/\s/g, "");
      const { error } = await supabase.from("profiles").update({ iban: cleanIban, account_holder_name: holder } as any).eq("id", userId);
      if (error) throw error;
      onSaved(cleanIban, holder);
      toast({ title: t("Salvat", "Saved"), description: t("IBAN actualizat cu succes", "IBAN updated successfully") });
    } catch {
      toast({ title: t("Eroare", "Error"), description: t("Nu s-a putut salva IBAN-ul", "Could not save IBAN"), variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {hasIban && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          {t("IBAN configurat — ești gata să primești plăți.", "IBAN set — you're ready to receive payouts.")}
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="iban" className="text-sm">IBAN</Label>
          <Input
            id="iban"
            value={formatIbanMask(iban)}
            onChange={(e) => setIban(e.target.value.toUpperCase().replace(/\s/g, ""))}
            placeholder="RO49 AAAA 1B31 0075 9384 0000"
            maxLength={42}
            className="font-mono tracking-wider"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_holder" className="text-sm">{t("Titular cont", "Account holder")}</Label>
          <Input id="account_holder" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Ion Popescu" maxLength={100} />
        </div>
      </div>
      <Button onClick={handleSave} disabled={saving || !iban} className="w-full sm:w-auto">
        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("Se salvează...", "Saving...")}</> : t("Salvează IBAN", "Save IBAN")}
      </Button>
    </div>
  );
};

export default AccountTab;
