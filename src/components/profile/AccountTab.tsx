import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  CreditCard, 
  Wallet,
  Shield,
  Trash2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
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

const AccountTab = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Mock verification statuses - can be connected to real data later
  const verificationStatus = {
    email: true, // Email is verified if user exists
    identity: false, // Mock - not verified
    phone: false, // Mock - not verified
  };

  const handlePasswordReset = async () => {
    setIsResettingPassword(true);
    try {
      // This would call supabase.auth.resetPasswordForEmail
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
        description: t(
          "Nu s-a putut trimite emailul de resetare",
          "Could not send reset email"
        ),
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeactivateAccount = async () => {
    toast({
      title: t("Funcție indisponibilă", "Feature unavailable"),
      description: t(
        "Dezactivarea contului nu este încă disponibilă",
        "Account deactivation is not yet available"
      ),
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("Starea contului", "Account status")}
            </CardTitle>
            <CardDescription>
              {t("Verificările contului tău", "Your account verifications")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                {verificationStatus.email ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                <span className="text-sm font-medium">Email</span>
              </div>
              <Badge variant={verificationStatus.email ? "default" : "secondary"}>
                {verificationStatus.email
                  ? t("Verificat", "Verified")
                  : t("Neverificat", "Unverified")}
              </Badge>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                {verificationStatus.identity ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                <span className="text-sm font-medium">
                  {t("Identitate", "Identity")}
                </span>
              </div>
              <Badge variant={verificationStatus.identity ? "default" : "secondary"}>
                {verificationStatus.identity
                  ? t("Verificată", "Verified")
                  : t("Neverificată", "Unverified")}
              </Badge>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                {verificationStatus.phone ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                <span className="text-sm font-medium">
                  {t("Telefon", "Phone")}
                </span>
              </div>
              <Badge variant={verificationStatus.phone ? "default" : "secondary"}>
                {verificationStatus.phone
                  ? t("Verificat", "Verified")
                  : t("Neverificat", "Unverified")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5" />
              {t("Schimbă parola", "Change password")}
            </CardTitle>
            <CardDescription>
              {t(
                "Primește un email pentru a-ți reseta parola",
                "Receive an email to reset your password"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={handlePasswordReset}
              disabled={isResettingPassword}
            >
              {isResettingPassword
                ? t("Se trimite...", "Sending...")
                : t("Schimbă parola", "Change password")}
            </Button>
          </CardContent>
        </Card>

        {/* Deactivate Account */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <Trash2 className="h-5 w-5" />
              {t("Dezactivare cont", "Deactivate account")}
            </CardTitle>
            <CardDescription>
              {t(
                "Odată dezactivat, contul tău nu va mai fi accesibil",
                "Once deactivated, your account will no longer be accessible"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  {t("Dezactivează contul", "Deactivate account")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("Ești sigur?", "Are you sure?")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(
                      "Această acțiune este ireversibilă. Toate datele tale vor fi șterse permanent.",
                      "This action is irreversible. All your data will be permanently deleted."
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t("Anulează", "Cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeactivateAccount}>
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
            <CardDescription>
              {t(
                "Adaugă un card pentru a putea face rezervări",
                "Add a card to make reservations"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <CreditCard className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                {t("Nicio metodă de plată adăugată", "No payment method added")}
              </p>
              <Button variant="outline">
                {t("Adaugă metodă de plată", "Add payment method")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payout Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5" />
              {t("Cum primești banii?", "How do you receive payments?")}
            </CardTitle>
            <CardDescription>
              {t(
                "Configurează modul în care primești plățile pentru închirierile tale",
                "Configure how you receive payments for your rentals"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <Wallet className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                {t("IBAN neconfigurat", "IBAN not configured")}
              </p>
              <Button variant="outline">
                {t("Configurează încasarea", "Configure payout")}
              </Button>
            </div>
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
              {t(
                "Toate plățile sunt procesate în siguranță prin partenerii noștri de încredere. Datele tale bancare sunt criptate și protejate.",
                "All payments are securely processed through our trusted partners. Your banking data is encrypted and protected."
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountTab;
