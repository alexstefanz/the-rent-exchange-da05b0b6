import { useState } from "react";
import { X, Mail } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: () => void;
}

const LoginDialog = ({ open, onOpenChange, onLoginSuccess }: LoginDialogProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+40");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handlePhoneSubmit = () => {
    // Simulate phone login
    onLoginSuccess();
  };

  const handleEmailSubmit = () => {
    // Simulate email login
    onLoginSuccess();
  };

  const handleSocialLogin = (provider: string) => {
    // Simulate social login
    console.log(`Login with ${provider}`);
    onLoginSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-center font-semibold">
            Autentifică-te pentru a rezerva
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {!showEmailForm ? (
            <>
              {/* Phone Number Login */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-xs text-muted-foreground">
                    Cod țară
                  </Label>
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selectează țara" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+40">România (+40)</SelectItem>
                      <SelectItem value="+44">UK (+44)</SelectItem>
                      <SelectItem value="+49">Germania (+49)</SelectItem>
                      <SelectItem value="+33">Franța (+33)</SelectItem>
                      <SelectItem value="+39">Italia (+39)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Număr de telefon"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Te vom suna sau îți vom trimite un SMS pentru a confirma numărul. Se aplică tarife standard pentru mesaje și date.{" "}
                    <span className="text-primary hover:underline cursor-pointer">Politica de Confidențialitate</span>
                  </p>
                </div>

                <Button 
                  onClick={handlePhoneSubmit}
                  className="w-full h-12 bg-[#E51D53] hover:bg-[#d41a4c] text-white font-medium"
                  disabled={!phoneNumber}
                >
                  Continuă
                </Button>
              </div>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-sm text-muted-foreground">
                  sau
                </span>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Button
                  variant="outline"
                  className="h-12 px-4"
                  onClick={() => handleSocialLogin("facebook")}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-12 px-4"
                  onClick={() => handleSocialLogin("google")}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-12 px-4"
                  onClick={() => handleSocialLogin("apple")}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                </Button>
              </div>

              {/* Email Login Button */}
              <Button
                variant="outline"
                className="w-full h-12 justify-start px-4"
                onClick={() => setShowEmailForm(true)}
              >
                <Mail className="h-5 w-5 mr-3" />
                Continuă cu email
              </Button>
            </>
          ) : (
            <>
              {/* Email Login Form */}
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmailForm(false)}
                  className="mb-2 -ml-2"
                >
                  ← Înapoi
                </Button>

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
                  />
                </div>

                <Button
                  onClick={handleEmailSubmit}
                  className="w-full h-12 bg-[#E51D53] hover:bg-[#d41a4c] text-white font-medium"
                  disabled={!email || !password}
                >
                  Autentifică-te
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Nu ai cont?{" "}
                  <span className="text-primary hover:underline cursor-pointer">
                    Înregistrează-te
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
