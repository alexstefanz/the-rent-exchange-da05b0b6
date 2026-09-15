import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SocialLoginButtonsProps {
  onSuccess?: () => void;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M14.94 9.63c-.023-2.174 1.773-3.22 1.854-3.27-1.01-1.477-2.58-1.68-3.14-1.703-1.336-.135-2.608.787-3.287.787-.678 0-1.726-.767-2.837-.747-1.46.021-2.807.849-3.559 2.157-1.517 2.632-.388 6.533 1.09 8.672.723 1.045 1.584 2.22 2.716 2.178 1.09-.044 1.502-.705 2.82-.705 1.318 0 1.688.705 2.837.683 1.173-.021 1.916-1.065 2.634-2.113.83-1.212 1.172-2.386 1.192-2.447-.026-.012-2.287-.878-2.31-3.484v-.008zM12.77 3.26c.6-.728.006-1.723.006-1.723s-1.42.058-2.486 1.274c-.954 1.086-.573 2.392-.573 2.392s1.484-.004 2.053-1.943h1z"/>
  </svg>
);

const SocialLoginButtons = ({ onSuccess }: SocialLoginButtonsProps) => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const { t } = useLanguage();

  // On the production domain we go straight to the auth server instead of the
  // Lovable OAuth broker, so the sign-in flow never leaves the rentli.ro origin.
  const isProductionDomain = /(^|\.)rentli\.ro$/i.test(window.location.hostname);

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setLoadingProvider(provider);
    try {
      if (isProductionDomain && provider === "google") {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: "https://rentli.ro/" },
        });
        if (error) {
          toast.error(t("Eroare la autentificare. Încearcă din nou.", "Authentication error. Please try again."));
        }
        return;
      }

      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        toast.error(t("Eroare la autentificare. Încearcă din nou.", "Authentication error. Please try again."));
        return;
      }

      if (result.redirected) {
        return;
      }

      // Session set successfully
      toast.success(t("Autentificare reușită!", "Successfully signed in!"));
      onSuccess?.();
    } catch {
      toast.error(t("Eroare la autentificare. Încearcă din nou.", "Authentication error. Please try again."));
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full h-12 gap-3 font-medium"
        onClick={() => handleSocialLogin("google")}
        disabled={!!loadingProvider}
      >
        {loadingProvider === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        {t("Continuă cu Google", "Continue with Google")}
      </Button>
      <Button
        variant="outline"
        className="w-full h-12 gap-3 font-medium"
        onClick={() => handleSocialLogin("apple")}
        disabled={!!loadingProvider}
      >
        {loadingProvider === "apple" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AppleIcon />}
        {t("Continuă cu Apple", "Continue with Apple")}
      </Button>
      <div className="relative my-4">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
          {t("sau", "or")}
        </span>
      </div>
    </div>
  );
};

export default SocialLoginButtons;
