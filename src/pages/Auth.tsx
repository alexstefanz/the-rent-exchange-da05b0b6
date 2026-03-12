import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Building2, User } from "lucide-react";
import logoImage from "@/assets/rentli_logo.png";
import { useUxCopy } from "@/hooks/useUxCopy";

const Auth = () => {
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
  const [accountType, setAccountType] = useState<"individual" | "business">("individual");
  const copy = useUxCopy();

  const isResetMode = isPasswordRecovery || searchParams.get("reset") === "true";

  const loginSchema = z.object({
    email: z.string().email(copy.auth.invalidEmail),
    password: z.string().min(6, copy.auth.passwordMin),
  });

  const registerSchema = z.object({
    fullName: z.string().min(2, copy.auth.nameMin),
    email: z.string().email(copy.auth.invalidEmail),
    password: z.string().min(6, copy.auth.passwordMin),
    confirmPassword: z.string(),
    companyName: z.string().max(100).optional().or(z.literal("")),
    cui: z.string().max(20).optional().or(z.literal("")),
    regCom: z.string().max(30).optional().or(z.literal("")),
  }).refine((data) => data.password === data.confirmPassword, {
    message: copy.auth.passwordMismatch,
    path: ["confirmPassword"],
  }).refine((data) => {
    if (accountType === "business") {
      return !!data.companyName && data.companyName.length >= 2;
    }
    return true;
  }, {
    message: "Denumirea firmei este obligatorie",
    path: ["companyName"],
  }).refine((data) => {
    if (accountType === "business") {
      return !!data.cui && data.cui.length >= 2;
    }
    return true;
  }, {
    message: "CUI-ul este obligatoriu",
    path: ["cui"],
  });

  const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, copy.auth.passwordMin),
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
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
    setIsResetting(false);
    if (error) {
      toast({ title: copy.auth.errorGeneric, description: error.message, variant: "destructive" });
    } else {
      toast({ title: copy.auth.emailSent, description: copy.auth.checkInbox });
      setShowResetDialog(false);
      setResetEmail("");
    }
  };

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", companyName: "", cui: "", regCom: "" },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmNewPassword: "" },
  });

  useEffect(() => {
    if (user && !isResetMode) navigate("/", { replace: true });
  }, [user, navigate, isResetMode]);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);
    if (error) {
      toast({
        title: copy.auth.loginError,
        description: error.message === "Invalid login credentials" ? copy.auth.invalidCredentials : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: copy.auth.loginSuccess, description: copy.auth.welcomeBackToast });
      navigate("/", { replace: true });
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    const metadata: Record<string, string> = { full_name: data.fullName };
    if (accountType === "business") {
      metadata.account_type = "business";
      metadata.company_name = data.companyName || "";
      metadata.cui = data.cui || "";
      metadata.reg_com = data.regCom || "";
    }
    const { error } = await signUp(data.email, data.password, data.fullName);
    setIsLoading(false);
    if (error) {
      let message = error.message;
      if (error.message.includes("already registered")) message = copy.auth.accountExists;
      toast({ title: copy.auth.registerError, description: message, variant: "destructive" });
    } else {
      // Update profile with business data after signup
      if (accountType === "business") {
        try {
          const { data: { user: newUser } } = await supabase.auth.getUser();
          if (newUser) {
            await supabase.from("profiles").update({
              account_type: "business",
              company_name: data.companyName || null,
              cui: data.cui || null,
              reg_com: data.regCom || null,
            }).eq("id", newUser.id);
          }
        } catch (e) {
          console.error("Failed to save business data:", e);
        }
      }
      setOtpEmail(data.email);
      setShowOtpVerification(true);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;
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
        await supabase.functions.invoke("send-general-notification", {
          body: {
            type: "welcome",
            email: otpEmail,
            full_name: verifiedUser?.user_metadata?.full_name || "",
          },
        });
      } catch (e) {
        console.error("Failed to send welcome email:", e);
      }
      navigate("/");
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
      toast({ title: "Eroare", description: "Nu am putut retrimite codul. Încearcă mai târziu.", variant: "destructive" });
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
      toast({ title: copy.auth.resetError, description: error.message, variant: "destructive" });
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
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={handleVerifyOtp} className="w-full" disabled={otpCode.length !== 6 || isVerifyingOtp}>
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
        <div className="mb-8">
          <img src={logoImage} alt="RentNow" className="h-12 w-auto" />
        </div>
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
      <div className="mb-8">
        <img src={logoImage} alt="RentNow" className="h-12 w-auto" />
      </div>
      
      <Card className="w-full max-w-md">
        <Tabs defaultValue="login" className="w-full">
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
              
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{copy.auth.email}</Label>
                  <Input id="login-email" type="email" placeholder="email@exemplu.ro" {...loginForm.register("email")} />
                  {loginForm.formState.errors.email && <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{copy.auth.password}</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" {...loginForm.register("password")} />
                  {loginForm.formState.errors.password && <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>}
                  <div className="flex justify-end">
                    <Button type="button" variant="link" className="px-0 h-auto text-sm text-muted-foreground hover:text-primary" onClick={() => setShowResetDialog(true)}>
                      {copy.auth.forgotPassword}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{copy.auth.loggingIn}</> : copy.auth.login}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <CardTitle className="text-xl">{copy.auth.createAccount}</CardTitle>
              <CardDescription>{copy.auth.registerSubtitle}</CardDescription>
              
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4 mt-4">
                {/* Account type toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={accountType === "individual" ? "default" : "outline"}
                    className="w-full gap-2"
                    onClick={() => setAccountType("individual")}
                  >
                    <User className="h-4 w-4" />
                    Persoană fizică
                  </Button>
                  <Button
                    type="button"
                    variant={accountType === "business" ? "default" : "outline"}
                    className="w-full gap-2"
                    onClick={() => setAccountType("business")}
                  >
                    <Building2 className="h-4 w-4" />
                    Persoană juridică
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-name">{copy.auth.fullName}</Label>
                  <Input id="register-name" type="text" placeholder="Ion Popescu" {...registerForm.register("fullName")} />
                  {registerForm.formState.errors.fullName && <p className="text-sm text-destructive">{registerForm.formState.errors.fullName.message}</p>}
                </div>

                {accountType === "business" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="register-company">Denumire firmă *</Label>
                      <Input id="register-company" type="text" placeholder="SC Exemplu SRL" maxLength={100} {...registerForm.register("companyName")} />
                      {registerForm.formState.errors.companyName && <p className="text-sm text-destructive">{registerForm.formState.errors.companyName.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="register-cui">CUI *</Label>
                        <Input id="register-cui" type="text" placeholder="RO12345678" maxLength={20} {...registerForm.register("cui")} />
                        {registerForm.formState.errors.cui && <p className="text-sm text-destructive">{registerForm.formState.errors.cui.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-regcom">Nr. Reg. Comerț</Label>
                        <Input id="register-regcom" type="text" placeholder="J40/1234/2024" maxLength={30} {...registerForm.register("regCom")} />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="register-email">{copy.auth.email}</Label>
                  <Input id="register-email" type="email" placeholder="email@exemplu.ro" {...registerForm.register("email")} />
                  {registerForm.formState.errors.email && <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">{copy.auth.password}</Label>
                  <Input id="register-password" type="password" placeholder="••••••••" {...registerForm.register("password")} />
                  {registerForm.formState.errors.password && <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm">{copy.auth.confirmPassword}</Label>
                  <Input id="register-confirm" type="password" placeholder="••••••••" {...registerForm.register("confirmPassword")} />
                  {registerForm.formState.errors.confirmPassword && <p className="text-sm text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
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
    </div>
  );
};

export default Auth;
