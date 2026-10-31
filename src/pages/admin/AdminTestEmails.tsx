import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Mail, CheckCircle, XCircle, Loader2, RotateCcw } from "lucide-react";

const DEFAULT_TEST_EMAIL = "z.alexstefan@gmail.com";
const STORAGE_KEY = "admin_test_email_recipient";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailTest {
  type: string;
  label: string;
  description: string;
  templateName: string;
}

const emailTests: EmailTest[] = [
  { type: "welcome", label: "Welcome (Bun venit)", description: "Email de bun venit la înregistrare", templateName: "welcome" },
  { type: "review_received", label: "Recenzie primită", description: "Notificare recenzie nouă primită", templateName: "review-received" },
  { type: "product_published", label: "Produs publicat", description: "Confirmare publicare produs", templateName: "product-published" },
  { type: "rental_new_owner", label: "Cerere nouă (Owner)", description: "Notificare proprietar - cerere nouă de închiriere", templateName: "rental-request-owner" },
  { type: "rental_new_renter", label: "Cerere trimisă (Renter)", description: "Confirmare chiriaș - cerere trimisă", templateName: "rental-request-renter" },
  { type: "message_new", label: "Mesaj nou", description: "Notificare mesaj nou primit", templateName: "new-message" },
  { type: "cancellation_owner", label: "Anulare (Owner)", description: "Notificare proprietar - cerere anulată", templateName: "cancellation-owner" },
  { type: "cancellation_renter", label: "Anulare (Renter)", description: "Confirmare chiriaș - anulare cerere", templateName: "cancellation-renter" },
  { type: "password_changed", label: "Parolă schimbată", description: "Notificare schimbare parolă", templateName: "password-changed" },
  { type: "rental_accepted", label: "Cerere acceptată", description: "Notificare chiriaș - cerere acceptată", templateName: "rental-accepted" },
  { type: "rental_rejected", label: "Cerere refuzată", description: "Notificare chiriaș - cerere refuzată", templateName: "rental-rejected" },
  { type: "deactivation", label: "Ștergere cont", description: "Email confirmare ștergere cont", templateName: "account-deactivation" },
];

type TestStatus = "idle" | "loading" | "success" | "error";

const AdminTestEmails = () => {
  const [statuses, setStatuses] = useState<Record<string, TestStatus>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [recipientEmail, setRecipientEmail] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_TEST_EMAIL;
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_TEST_EMAIL;
  });

  const trimmedEmail = recipientEmail.trim();
  const isEmailValid = EMAIL_REGEX.test(trimmedEmail);

  const handleEmailChange = (value: string) => {
    setRecipientEmail(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, value);
    }
  };

  const resetEmail = () => {
    setRecipientEmail(DEFAULT_TEST_EMAIL);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, DEFAULT_TEST_EMAIL);
    }
  };

  const sendTest = async (type: string) => {
    if (!isEmailValid) {
      toast.error("Email destinatar invalid");
      return;
    }

    setStatuses((prev) => ({ ...prev, [type]: "loading" }));
    setErrors((prev) => ({ ...prev, [type]: "" }));

    try {
      const { data, error } = await supabase.functions.invoke("test-email-notifications", {
        body: { type, recipientEmail: trimmedEmail },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setStatuses((prev) => ({ ...prev, [type]: "success" }));
      toast.success(`Email "${type}" trimis către ${trimmedEmail}!`);
    } catch (err: any) {
      const msg = err?.message || "Eroare necunoscută";
      setStatuses((prev) => ({ ...prev, [type]: "error" }));
      setErrors((prev) => ({ ...prev, [type]: msg }));
      toast.error(`Eroare la "${type}": ${msg}`);
    }
  };

  const sendAll = async () => {
    if (!isEmailValid) {
      toast.error("Email destinatar invalid");
      return;
    }
    for (const test of emailTests) {
      await sendTest(test.type);
      await new Promise((r) => setTimeout(r, 1500));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Test Emailuri</h1>
            <p className="text-muted-foreground mt-1">
              Trimite notificări de test către{" "}
              <strong>{isEmailValid ? trimmedEmail : "(email invalid)"}</strong>{" "}
              via <strong>onboarding@resend.dev</strong> (mod test)
            </p>
            <p className="text-xs text-amber-600 mt-2 max-w-2xl">
              ⚠️ Mod test temporar: emailurile pleacă de la <code>onboarding@resend.dev</code> și
              pot fi livrate doar către adresa contului Resend până la verificarea DNS pentru <code>rentli.ro</code>.
            </p>
          </div>
          <Button onClick={sendAll} size="lg" disabled={!isEmailValid}>
            <Mail className="mr-2 h-4 w-4" />
            Trimite toate
          </Button>
        </div>

        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="recipient_email" className="text-sm font-medium">
                Email destinatar pentru teste
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="recipient_email"
                  type="email"
                  placeholder="exemplu@email.com"
                  value={recipientEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={
                    isEmailValid || !trimmedEmail
                      ? "max-w-md"
                      : "max-w-md border-destructive focus-visible:ring-destructive"
                  }
                  maxLength={254}
                />
                {recipientEmail !== DEFAULT_TEST_EMAIL && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetEmail}
                    className="sm:flex-shrink-0"
                  >
                    <RotateCcw className="mr-2 h-3 w-3" />
                    Reset
                  </Button>
                )}
              </div>
              {!isEmailValid && trimmedEmail.length > 0 && (
                <p className="text-xs text-destructive">Format email invalid</p>
              )}
              <p className="text-xs text-muted-foreground">
                Adresa e salvată local pentru sesiunile viitoare. Toate testele
                de mai jos folosesc acest destinatar.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {emailTests.map((test) => {
            const status = statuses[test.type] || "idle";
            return (
              <Card key={test.type} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-semibold">{test.label}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {test.templateName}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">{test.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={status === "success" ? "outline" : "default"}
                      onClick={() => sendTest(test.type)}
                      disabled={status === "loading"}
                      className="w-full"
                    >
                      {status === "loading" && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                      {status === "success" && <CheckCircle className="mr-2 h-3 w-3 text-green-600" />}
                      {status === "error" && <XCircle className="mr-2 h-3 w-3 text-red-600" />}
                      {status === "loading" ? "Se trimite..." : "Trimite test"}
                    </Button>
                  </div>
                  {status === "error" && errors[test.type] && (
                    <p className="text-xs text-destructive mt-2 break-all">{errors[test.type]}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTestEmails;
