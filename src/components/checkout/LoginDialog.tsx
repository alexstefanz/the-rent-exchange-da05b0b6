import { useState } from "react";
import { Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: () => void;
}

const LoginDialog = ({ open, onOpenChange, onLoginSuccess }: LoginDialogProps) => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName || undefined);
        if (error) {
          toast.error(error.message.includes("already registered")
            ? "Un cont cu acest email există deja"
            : error.message);
        } else {
          setOtpEmail(email);
          setShowOtp(true);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message.includes("Invalid login")
            ? "Email sau parolă greșită"
            : error.message);
        } else {
          toast.success("Autentificare reușită!");
          onLoginSuccess();
        }
      }
    } finally {
      setLoading(false);
    }
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
      toast.error("Codul introdus este greșit sau a expirat.");
    } else {
      toast.success("Cont verificat cu succes!");
      onLoginSuccess();
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
      toast.error("Nu am putut retrimite codul.");
    } else {
      toast.success(`Cod retrimis pe ${otpEmail}`);
      setOtpCode("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-center font-semibold">
            {showOtp
              ? "Verifică-ți emailul"
              : isSignUp
                ? "Creează cont pentru a rezerva"
                : "Autentifică-te pentru a rezerva"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {showOtp ? (
            <>
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Am trimis un cod de verificare pe <strong>{otpEmail}</strong>
                </p>
              </div>

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

              <Button
                onClick={handleVerifyOtp}
                className="w-full h-12 bg-[#E51D53] hover:bg-[#d41a4c] text-white font-medium"
                disabled={otpCode.length !== 8 || isVerifyingOtp}
              >
                {isVerifyingOtp ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Se verifică...</> : "Verifică codul"}
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Nu ai primit codul?</p>
                <Button variant="link" size="sm" onClick={handleResendOtp} disabled={isResendingOtp}>
                  {isResendingOtp ? "Se retrimite..." : "Retrimite codul"}
                </Button>
              </div>

              <Button variant="ghost" size="sm" className="w-full" onClick={() => { setShowOtp(false); setOtpCode(""); }}>
                ← Înapoi
              </Button>
            </>
          ) : (
            <>
              <SocialLoginButtons onSuccess={onLoginSuccess} />

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nume complet</Label>
                  <Input
                    id="fullName"
                    placeholder="Ion Popescu"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemplu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Parolă</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Introdu parola"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full h-12 bg-[#E51D53] hover:bg-[#d41a4c] text-white font-medium"
                disabled={!email || !password || loading}
              >
                {loading ? "Se procesează..." : isSignUp ? "Creează cont" : "Autentifică-te"}
              </Button>

              <Separator />

              <p className="text-center text-sm text-muted-foreground">
                {isSignUp ? "Ai deja cont?" : "Nu ai cont?"}{" "}
                <span
                  className="text-primary hover:underline cursor-pointer"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? "Autentifică-te" : "Înregistrează-te"}
                </span>
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
