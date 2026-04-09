import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";

const TEST_EMAIL = "z.alexstefan@gmail.com";

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
  { type: "deactivation", label: "Dezactivare cont", description: "Email confirmare dezactivare cont", templateName: "account-deactivation" },
];

type TestStatus = "idle" | "loading" | "success" | "error";

const AdminTestEmails = () => {
  const [statuses, setStatuses] = useState<Record<string, TestStatus>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sendTest = async (type: string) => {
    setStatuses((prev) => ({ ...prev, [type]: "loading" }));
    setErrors((prev) => ({ ...prev, [type]: "" }));

    try {
      const { data, error } = await supabase.functions.invoke("test-email-notifications", {
        body: { type },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setStatuses((prev) => ({ ...prev, [type]: "success" }));
      toast.success(`Email "${type}" trimis cu succes!`);
    } catch (err: any) {
      const msg = err?.message || "Eroare necunoscută";
      setStatuses((prev) => ({ ...prev, [type]: "error" }));
      setErrors((prev) => ({ ...prev, [type]: msg }));
      toast.error(`Eroare la "${type}": ${msg}`);
    }
  };

  const sendAll = async () => {
    for (const test of emailTests) {
      await sendTest(test.type);
      await new Promise((r) => setTimeout(r, 1500));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Test Emailuri</h1>
            <p className="text-muted-foreground mt-1">
              Trimite notificări de test către <strong>{TEST_EMAIL}</strong> via <strong>noreply@rentli.ro</strong>
            </p>
          </div>
          <Button onClick={sendAll} size="lg">
            <Mail className="mr-2 h-4 w-4" />
            Trimite toate
          </Button>
        </div>

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
