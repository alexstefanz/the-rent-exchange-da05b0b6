import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import logoImage from "@/assets/rentnow_logo.png";
import { useUxCopy } from "@/hooks/useUxCopy";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const copy = useUxCopy();

  const loginSchema = z.object({
    email: z.string().email(copy.auth.invalidEmail),
    password: z.string().min(6, copy.auth.passwordMin),
  });

  const registerSchema = z.object({
    fullName: z.string().min(2, copy.auth.nameMin),
    email: z.string().email(copy.auth.invalidEmail),
    password: z.string().min(6, copy.auth.passwordMin),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: copy.auth.passwordMismatch,
    path: ["confirmPassword"],
  });

  type LoginFormData = z.infer<typeof loginSchema>;
  type RegisterFormData = z.infer<typeof registerSchema>;

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
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

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
      navigate("/");
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.fullName);
    setIsLoading(false);
    if (error) {
      let message = error.message;
      if (error.message.includes("already registered")) message = copy.auth.accountExists;
      toast({ title: copy.auth.registerError, description: message, variant: "destructive" });
    } else {
      toast({ title: copy.auth.accountCreated, description: copy.auth.accountCreatedDesc });
      navigate("/");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                <div className="space-y-2">
                  <Label htmlFor="register-name">{copy.auth.fullName}</Label>
                  <Input id="register-name" type="text" placeholder="Ion Popescu" {...registerForm.register("fullName")} />
                  {registerForm.formState.errors.fullName && <p className="text-sm text-destructive">{registerForm.formState.errors.fullName.message}</p>}
                </div>
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
