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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
          toast.success("Verifică-ți emailul pentru confirmare, apoi autentifică-te.");
          setIsSignUp(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-center font-semibold">
            {isSignUp ? "Creează cont pentru a rezerva" : "Autentifică-te pentru a rezerva"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
