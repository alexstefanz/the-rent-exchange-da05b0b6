import { usePageSeo } from "@/hooks/usePageSeo";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import logoImage from "@/assets/rentli_logo.webp";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";
import { strongPasswordSchema, isWeakPasswordError } from "@/lib/passwordValidation";
import PhoneOtpDialog from "@/components/profile/PhoneOtpDialog";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

// TEMP: while notify.rentli.ro DNS isn't propagated, we verify accounts via SMS
// instead of email. Set USE_SMS_OTP=false to revert to email OTP confirmation.
const USE_SMS_OTP = true;

// Romanian phone: +40XXXXXXXXX, 0040XXXXXXXXX, 40XXXXXXXXX or 07XXXXXXXX (also 02/03 landline)
const RO_PHONE_REGEX = /^(\+40|0040|40|0)[0-9]{9}$/;
const normalizePhoneRO = (raw: string): string | null => {
  if (!raw) return null;
  const p = raw.trim().replace(/[\s()-]/g, "");
  if (/^\+40[0-9]{9}$/.test(p)) return p;
  if (/^0040[0-9]{9}$/.test(p)) return "+" + p.slice(2);
  if (/^40[0-9]{9}$/.test(p)) return "+" + p;
  if (/^0[0-9]{9}$/.test(p)) return "+40" + p.slice(1);
  return null;
};

const Auth = () => {
  usePageSeo({ title: "Autentificare — Rentli", description: "Zona privată a contului tău Rentli.", noindex: true });
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading, signIn, signUp, isPasswordRecovery, clearPasswordRecovery } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [phoneOtpOpen, setPhoneOtpOpen] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");
  const [gatingLogin, setGatingLogin] = useState(false);
  // Ref mirror of gatingLogin so async callbacks (dialog onOpenChange)
  // never read a stale closure value and accidentally sign the user out.
  const gatingLoginRef = useRef(false);
  useEffect(() => { gatingLoginRef.current = gatingLogin; }, [gatingLogin]);
  // Credentials saved during the signup OTP flow so that — if
  // refreshSession() fails after phone verification — we can re-establish
  // a fully authenticated session without forcing the user to re-login.
  const pendingCredsRef = useRef<{ email: string; password: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [rememberMeRegister, setRememberMeRegister] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("rentli_remember_me") === "1";
  });
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("rentli_remember_me") === "1";
  });
  const copy = useUxCopy();
  const { language } = useLanguage();

  const isResetMode = isPasswordRecovery || searchParams.get("reset") === "true";

  const loginSchema = z.object({
    email: z.string().email(copy.auth.invalidEmail),
    password: z.string().min(1, copy.auth.passwordMin),
  });

  const registerSchema = z.object({
    email: z.string().email(copy.auth.invalidEmail),
    phone: z.string()
      .trim()
      .refine((v) => normalizePhoneRO(v) !== null, {
        message: "Număr de telefon invalid. Format: +40712345678 sau 0712345678",
      }),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
    terms: z.literal(true, {
      errorMap: () => ({ message: "Trebuie să accepți termenii" }),
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: copy.auth.passwordMismatch,
    path: ["confirmPassword"],
  });

  const resetPasswordSchema = z.object({
    newPassword: strongPasswordSchema,
    confirmNewPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: copy.auth.passwordMismatch,
    path: ["confirmNewPassword"],
  });

  type LoginFormData = z.infer<typeof loginSchema>;
  type RegisterFormData = z.infer<typeof registerSchema>;
  type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

  const handleResetPassword = async () => {
    if (!resetEmail) return;
    setIsResetting(true);

    // 1. Pre-check via diagnostic edge function: tell the user clearly
    //    when no account exists for this email (Supabase silently no-ops in
    //    that case, which makes it look like the email service is broken).
    try {
      const { data: diag } = await supabase.functions.invoke(
        "password-reset-diagnostics",
        { body: { email: resetEmail.trim().toLowerCase() } }
      );
      if (diag && diag.exists === false) {
        setIsResetting(false);
        toast({
          title: copy.auth.accountNotFound,
          description: copy.auth.accountNotFoundDesc,
          variant: "destructive",
        });
        return;
      }
    } catch (_diagErr) {
      // Fail open — if diagnostics is unreachable we still try the real reset.
    }

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
    setIsResetting(false);

    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("security purposes") || msg.includes("rate") || (error as any).status === 429) {
        toast({
          title: copy.auth.rateLimitTitle,
          description: copy.auth.rateLimitDesc,
          variant: "destructive",
        });
      } else {
        toast({
          title: copy.auth.errorGeneric,
          description: error.message,
          variant: "destructive",
        });
      }
      return;
    }

    toast({ title: copy.auth.emailSent, description: copy.auth.checkInbox });
    setShowResetDialog(false);
    setResetEmail("");
  };

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: typeof window !== "undefined" ? localStorage.getItem("rentli_remembered_email") || "" : "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", phone: "", password: "", confirmPassword: "", terms: false as unknown as true },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmNewPassword: "" },
  });

  useEffect(() => {
    if (user && !isResetMode && !phoneOtpOpen && !gatingLogin) navigate("/", { replace: true });
  }, [user, navigate, isResetMode, phoneOtpOpen, gatingLogin]);

  const handleLogin = async (data: LoginFormData) => {
    setLoginError(null);
    setIsLoading(true);
    // Block redirect-on-user-set while we check phone verification gate
    if (USE_SMS_OTP) setGatingLogin(true);
    const email = (data.email || "").trim().toLowerCase();
    let error: any = null;
    try {
      const res = await signIn(email, data.password);
      error = res?.error ?? null;
    } catch (e: any) {
      error = e;
    } finally {
      setIsLoading(false);
    }
    if (error) {
      setGatingLogin(false);
      const code = (error?.code || "").toString();
      const status = Number(error?.status || 0);
      const raw = (error?.message || "").toString();
      let msg = copy.auth.invalidCredentials;
      if (code === "invalid_credentials" || /invalid login credentials/i.test(raw)) {
        msg = copy.auth.invalidCredentials;
      } else if (code === "email_not_confirmed" || /not confirmed/i.test(raw)) {
        msg = language === "ro"
          ? "Verifică-ți emailul pentru a-ți confirma contul."
          : "Please verify your email to confirm your account.";
      } else if (status === 429 || /rate limit|too many/i.test(raw)) {
        msg = language === "ro"
          ? "Prea multe încercări. Așteaptă câteva minute și reîncearcă."
          : "Too many attempts. Wait a few minutes and try again.";
      } else if (raw) {
        msg = raw;
      }
      setLoginError(msg);
      toast({
        title: copy.auth.loginError,
        description: msg,
        variant: "destructive",
      });
      return;
    }

      if (rememberMe) {
        localStorage.setItem("rentli_remember_me", "1");
        localStorage.setItem("rentli_remembered_email", data.email);
      } else {
        localStorage.removeItem("rentli_remember_me");
        localStorage.removeItem("rentli_remembered_email");
      }

      // SMS gate: if account hasn't completed phone verification, block login
      // and trigger PhoneOtpDialog. Existing accounts are backfilled as verified.
      if (USE_SMS_OTP) {
        try {
          const { data: { user: signedIn } } = await supabase.auth.getUser();
          if (signedIn) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("phone, phone_verified")
              .eq("id", signedIn.id)
              .maybeSingle();
            if (prof && prof.phone_verified === false) {
              if (!prof.phone) {
                toast({
                  title: "Verificare necesară",
                  description: "Contul tău nu are un număr de telefon. Te rugăm să creezi contul din nou cu un număr valid.",
                  variant: "destructive",
                });
                await supabase.auth.signOut();
                setGatingLogin(false);
                return;
              }
              setPendingPhone(prof.phone);
              setPhoneOtpOpen(true);
              return;
            }
          }
        } catch (e) {
          console.error("phone gate check failed:", e);
        }
        setGatingLogin(false);
      }

      toast({ title: copy.auth.loginSuccess, description: copy.auth.welcomeBackToast });
      navigate("/", { replace: true });
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    // Block redirect-on-user-set while we open the SMS OTP dialog
    if (USE_SMS_OTP) setGatingLogin(true);
    const { error } = await signUp(data.email, data.password, undefined);
    setIsLoading(false);
    if (error) {
      setGatingLogin(false);
      let message = error.message;
      const alreadyRegistered =
        error.message?.includes("already registered") ||
        (error as any)?.name === "UserAlreadyExists";
      if (alreadyRegistered) {
        message = `${copy.auth.accountExists}. Autentifică-te sau folosește „Am uitat parola”.`;
        toast({ title: copy.auth.registerError, description: message, variant: "destructive" });
        registerForm.setError("email", { type: "server", message });
        // Switch to login tab and prefill email so users can log in immediately
        setActiveTab("login");
        loginForm.setValue("email", data.email);
        return;
      }
      const isRateLimit =
        (error as any)?.code === "over_email_send_rate_limit" ||
        (error as any)?.status === 429 ||
        /rate limit/i.test(error.message || "");
      if (isRateLimit) {
        const rateMsg =
          "Au fost prea multe încercări de înregistrare de pe această rețea. Te rugăm să aștepți câteva minute și să încerci din nou, sau folosește autentificarea cu Google.";
        toast({
          title: "Prea multe încercări",
          description: rateMsg,
          variant: "destructive",
        });
        registerForm.setError("email", { type: "server", message: rateMsg });
        registerForm.setFocus("email");
        return;
      }
      if (isWeakPasswordError(error.message)) {
        message = copy.auth.passwordTooWeak;
        toast({ title: "Parola nu poate fi folosită", description: message, variant: "destructive" });
        registerForm.setError("password", { type: "server", message });
        registerForm.setFocus("password");
        return;
      }
      toast({ title: copy.auth.registerError, description: message, variant: "destructive" });
      registerForm.setError("password", { type: "server", message });
      return;
    }
      const normalizedPhone = normalizePhoneRO(data.phone) as string;
      try {
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          await supabase.from("profiles").update({ phone: normalizedPhone }).eq("id", newUser.id);
        }
      } catch (e) {
        console.error("Failed to set profile after signup:", e);
      }

      if (USE_SMS_OTP) {
        // Save credentials so PhoneOtpDialog can re-sign-in as fallback
        // if refreshSession() fails right after phone verification.
        pendingCredsRef.current = { email: data.email, password: data.password };
        setPendingPhone(normalizedPhone);
        setPhoneOtpOpen(true);
      } else {
        setOtpEmail(data.email);
        setShowOtpVerification(true);
      }

      if (rememberMeRegister) {
        localStorage.setItem("rentli_remember_me", "1");
        localStorage.setItem("rentli_remembered_email", data.email);
      } else {
        localStorage.removeItem("rentli_remember_me");
        localStorage.removeItem("rentli_remembered_email");
      }
  };

  const handlePhoneVerified = async () => {
    // Fire-and-forget welcome email (will queue until domain is live)
    try {
      const { data: { user: verifiedUser } } = await supabase.auth.getUser();
      if (verifiedUser?.email) {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "welcome",
            recipientEmail: verifiedUser.email,
            idempotencyKey: `welcome-${verifiedUser.id}`,
            templateData: { name: verifiedUser?.user_metadata?.full_name || "" },
          },
        });
      }
    } catch (e) {
      console.error("welcome email failed:", e);
    }
    toast({ title: "Cont verificat!", description: "Bun venit pe Rentli." });
    setPhoneOtpOpen(false);
    setGatingLogin(false);
    pendingCredsRef.current = null;
    navigate("/", { replace: true });
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 8) return;
    setIsVerifyingOtp(true);
    const { error } = await supabase.auth.verifyOtp({
      email: otpEmail,
      token: otpCode,
      type: "signup",
    });
    setIsVerifyingOtp(false);
    if (error) {
      toast({ title: "Cod invalid", description: "Codul introdus este greșit sau a expirat. Încearcă din nou.", variant: "destructive" });
    } else {
      toast({ title: "Cont verificat!", description: "Contul tău a fost confirmat cu succes." });
      // Send welcome email (fire and forget)
      try {
        const { data: { user: verifiedUser } } = await supabase.auth.getUser();
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "welcome",
            recipientEmail: otpEmail,
            idempotencyKey: `welcome-${verifiedUser?.id ?? otpEmail}`,
            templateData: { name: verifiedUser?.user_metadata?.full_name || "" },
          },
        });
      } catch (e) {
        console.error("Failed to send welcome email:", e);
      }
      navigate("/", { replace: true });
    }
  };

  const handleResendOtp = async () => {
    setIsResendingOtp(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: otpEmail,
    });
    setIsResendingOtp(false);
    if (error) {
      const isRateLimit =
        (error as any)?.code === "over_email_send_rate_limit" ||
        (error as any)?.status === 429 ||
        /rate limit/i.test(error.message || "");
      toast({
        title: isRateLimit ? "Prea multe încercări" : "Eroare",
        description: isRateLimit
          ? "Te rugăm să aștepți 1-2 minute înainte să retrimiți codul."
          : "Nu am putut retrimite codul. Încearcă mai târziu.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Cod retrimis", description: `Am trimis un nou cod pe ${otpEmail}` });
      setOtpCode("");
    }
  };

  const handleSetNewPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: data.newPassword });
    
    if (error) {
      setIsLoading(false);
      toast({
        title: copy.auth.resetError,
        description: isWeakPasswordError(error.message) ? copy.auth.passwordTooWeak : error.message,
        variant: "destructive",
      });
      return;
    }

    // Send confirmation email
    try {
      const userEmail = user?.email;
      if (userEmail) {
        await supabase.functions.invoke("send-password-changed-notification", {
          body: { email: userEmail },
        });
      }
    } catch (e) {
      console.error("Failed to send password changed notification:", e);
    }

    setIsLoading(false);
    toast({ title: copy.auth.resetSuccess, description: copy.auth.resetSuccessDesc });
    
    // Clear recovery state and redirect to login
    clearPasswordRecovery();
    setSearchParams({});
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // OTP Verification screen
  if (showOtpVerification) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-8">
        <div className="fixed top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>
        <Link to="/" className="mb-8 block">
          <img src={logoImage} alt="RentNow" className="h-12 w-auto" />
        </Link>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Verifică-ți emailul</CardTitle>
            <CardDescription>
              Am trimis un cod de verificare pe <strong>{otpEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP maxLength={8} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                  <InputOTPSlot index={6} />
                  <InputOTPSlot index={7} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={handleVerifyOtp} className="w-full" disabled={otpCode.length !== 8 || isVerifyingOtp}>
              {isVerifyingOtp ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Se verifică...</> : "Verifică codul"}
            </Button>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Nu ai primit codul?</p>
              <Button variant="link" onClick={handleResendOtp} disabled={isResendingOtp} className="text-sm">
                {isResendingOtp ? "Se retrimite..." : "Retrimite codul"}
              </Button>
            </div>
            <Button variant="ghost" className="w-full text-sm" onClick={() => { setShowOtpVerification(false); setOtpCode(""); }}>
              ← Înapoi la înregistrare
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Reset password mode
  if (isResetMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-8">
        <div className="fixed top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>
        <Link to="/" className="mb-8 block">
          <img src={logoImage} alt="RentNow" className="h-12 w-auto" />
        </Link>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">{copy.auth.setNewPassword}</CardTitle>
            <CardDescription>{copy.auth.setNewPasswordSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={resetForm.handleSubmit(handleSetNewPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">{copy.auth.newPassword}</Label>
                <Input id="new-password" type="password" placeholder="••••••••" {...resetForm.register("newPassword")} />
                <p className="text-xs text-muted-foreground">{copy.auth.passwordRequirements}</p>
                {resetForm.formState.errors.newPassword && <p className="text-sm text-destructive">{resetForm.formState.errors.newPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">{copy.auth.confirmNewPassword}</Label>
                <Input id="confirm-new-password" type="password" placeholder="••••••••" {...resetForm.register("confirmNewPassword")} />
                {resetForm.formState.errors.confirmNewPassword && <p className="text-sm text-destructive">{resetForm.formState.errors.confirmNewPassword.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{copy.auth.resettingPassword}</> : copy.auth.resetPasswordButton}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-8">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <Link to="/" className="mb-8 block">
        <img src={logoImage} alt="RentNow" className="h-12 w-auto" />
      </Link>
      
      <Card className="w-full max-w-md">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")} className="w-full">
          <CardHeader className="space-y-1 pb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{copy.auth.login}</TabsTrigger>
              <TabsTrigger value="register">{copy.auth.register}</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent>
            <TabsContent value="login" className="space-y-4">
              <CardTitle className="text-xl">{copy.auth.welcomeBack}</CardTitle>
              <CardDescription>{copy.auth.loginSubtitle}</CardDescription>
              
              <div className="mt-4">
                <SocialLoginButtons onSuccess={() => navigate("/", { replace: true })} />
              </div>

              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{copy.auth.email}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="email@exemplu.ro"
                    {...loginForm.register("email", {
                      onChange: () => { if (loginError) setLoginError(null); },
                    })}
                  />
                  {loginForm.formState.errors.email && <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{copy.auth.password}</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10"
                      {...loginForm.register("password", {
                        onChange: () => { if (loginError) setLoginError(null); },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showLoginPassword ? "Ascunde parola" : "Arată parola"}
                      tabIndex={-1}
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                      <Checkbox
                        checked={rememberMe}
                        onCheckedChange={(c) => setRememberMe(c === true)}
                      />
                      Ține-mă minte
                    </label>
                    <Button type="button" variant="link" className="px-0 h-auto text-sm text-muted-foreground hover:text-primary" onClick={() => setShowResetDialog(true)}>
                      {copy.auth.forgotPassword}
                    </Button>
                  </div>
                </div>
                {loginError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{copy.auth.loggingIn}</> : copy.auth.login}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <CardTitle className="text-xl">{copy.auth.createAccount}</CardTitle>
              <CardDescription>{copy.auth.registerSubtitle}</CardDescription>
              
              <div className="mt-4">
                <SocialLoginButtons onSuccess={() => navigate("/", { replace: true })} />
              </div>

              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Cont gratuit, fără card de credit.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="register-email">{copy.auth.email}</Label>
                  <Input id="register-email" type="email" className="h-12" placeholder="email@exemplu.ro" {...registerForm.register("email")} />
                  {registerForm.formState.errors.email && <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-phone">Număr de telefon</Label>
                  <Input
                    id="register-phone"
                    type="tel"
                    inputMode="tel"
                    className="h-12"
                    placeholder="+40712345678"
                    autoComplete="tel"
                    {...registerForm.register("phone")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Vei primi un SMS cu un cod de 6 cifre pentru a-ți verifica contul.
                  </p>
                  {registerForm.formState.errors.phone && <p className="text-sm text-destructive">{registerForm.formState.errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">{copy.auth.password}</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10 h-12"
                      {...registerForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showRegisterPassword ? "Ascunde parola" : "Arată parola"}
                      tabIndex={-1}
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{copy.auth.passwordRequirements}</p>
                  {registerForm.formState.errors.password && <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm">{copy.auth.confirmPassword}</Label>
                  <div className="relative">
                    <Input
                      id="register-confirm"
                      type={showRegisterConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10 h-12"
                      {...registerForm.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showRegisterConfirm ? "Ascunde parola" : "Arată parola"}
                      tabIndex={-1}
                    >
                      {showRegisterConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.confirmPassword && <p className="text-sm text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>}
                </div>
                <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                  <Checkbox
                    className="mt-0.5"
                    checked={!!registerForm.watch("terms")}
                    onCheckedChange={(c) =>
                      registerForm.setValue("terms", (c === true) as true, { shouldValidate: true })
                    }
                  />
                  <span className="leading-snug">
                    Sunt de acord cu{" "}
                    <Link to="/termeni-si-conditii" className="text-primary underline-offset-2 hover:underline">
                      Termenii
                    </Link>{" "}
                    și{" "}
                    <Link to="/politica-confidentialitate" className="text-primary underline-offset-2 hover:underline">
                      Politica GDPR
                    </Link>
                    .
                  </span>
                </label>
                {registerForm.formState.errors.terms && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.terms.message as string}</p>
                )}
                <Button type="submit" size="lg" className="w-full h-12" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{copy.auth.creatingAccount}</> : copy.auth.register}
                </Button>
              </form>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      <a href="/" className="mt-6 text-sm text-muted-foreground hover:text-primary transition-colors">
        ← Înapoi la pagina principală
      </a>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{copy.auth.resetPassword}</DialogTitle>
            <DialogDescription>{copy.auth.resetDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{copy.auth.email}</Label>
              <Input id="reset-email" type="email" placeholder="email@exemplu.ro" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleResetPassword(); } }} />
            </div>
            <Button onClick={handleResetPassword} className="w-full" disabled={isResetting || !resetEmail}>
              {isResetting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{copy.auth.sending}</> : copy.auth.sendResetLink}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PhoneOtpDialog
        open={phoneOtpOpen}
        phone={pendingPhone}
        onOpenChange={(o) => {
          setPhoneOtpOpen(o);
          // Only sign out when user closes the dialog WITHOUT completing
          // verification. If pendingCredsRef is null, handlePhoneVerified
          // already cleared it → verification succeeded, keep the session.
          if (!o && gatingLoginRef.current && pendingCredsRef.current) {
            // User closed the gate without verifying — sign out so they retry.
            supabase.auth.signOut();
            setGatingLogin(false);
            pendingCredsRef.current = null;
          }
        }}
        onVerified={handlePhoneVerified}
        fallbackCreds={pendingCredsRef.current}
      />
    </div>
  );
};

export default Auth;
