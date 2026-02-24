import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Wifi, WifiOff, Send, CheckCircle2, XCircle } from "lucide-react";

const contactSchema = z.object({
  FirstName: z.string().min(1, "Prenumele este obligatoriu").max(100),
  LastName: z.string().min(1, "Numele este obligatoriu").max(100),
  Email: z.string().email("Email invalid"),
  Phone: z.string().max(20).optional().or(z.literal("")),
});

type ContactFormData = z.infer<typeof contactSchema>;

type ApiResult = {
  type: "success" | "error";
  message: string;
  raw: unknown;
};

export default function MiniCrmTest() {
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "loading" | "connected" | "error">("idle");
  const [connectionResult, setConnectionResult] = useState<unknown>(null);
  const [submitResult, setSubmitResult] = useState<ApiResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { FirstName: "", LastName: "", Email: "", Phone: "" },
  });

  const callProxy = async (action: string, data?: Record<string, string>) => {
    const { data: result, error } = await supabase.functions.invoke("minicrm-proxy", {
      body: { action, data },
    });
    if (error) throw error;
    return result;
  };

  const testConnection = async () => {
    setConnectionStatus("loading");
    setConnectionResult(null);
    try {
      const result = await callProxy("test-connection");
      setConnectionResult(result);
      setConnectionStatus(result.success && result.connected ? "connected" : "error");
    } catch (err: unknown) {
      setConnectionResult(err);
      setConnectionStatus("error");
    }
  };

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitResult(null);
    try {
      const result = await callProxy("create-contact", {
        FirstName: data.FirstName,
        LastName: data.LastName,
        Email: data.Email,
        ...(data.Phone ? { Phone: data.Phone } : {}),
      });
      setSubmitResult({
        type: result.success ? "success" : "error",
        message: result.success
          ? `Contact creat cu succes${result.contactId ? ` (ID: ${result.contactId})` : ""}`
          : result.error || "Eroare necunoscută",
        raw: result,
      });
      if (result.success) form.reset();
    } catch (err: unknown) {
      setSubmitResult({
        type: "error",
        message: err instanceof Error ? err.message : "Eroare de rețea",
        raw: err,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MiniCRM Integration Test</h1>
          <p className="text-muted-foreground mt-1">POC — creare contact (lead) în MiniCRM</p>
        </div>

        {/* Test Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conexiune MiniCRM</CardTitle>
            <CardDescription>Verifică dacă credențialele sunt configurate corect</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Button onClick={testConnection} disabled={connectionStatus === "loading"} variant="outline">
                {connectionStatus === "loading" ? (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                ) : connectionStatus === "connected" ? (
                  <Wifi className="mr-2 h-4 w-4" />
                ) : connectionStatus === "error" ? (
                  <WifiOff className="mr-2 h-4 w-4" />
                ) : (
                  <Wifi className="mr-2 h-4 w-4" />
                )}
                Test Connection
              </Button>
              {connectionStatus === "connected" && (
                <Badge className="bg-primary text-primary-foreground">Connected</Badge>
              )}
              {connectionStatus === "error" && (
                <Badge variant="destructive">Error</Badge>
              )}
            </div>
            {connectionResult && (
              <pre className="rounded-md bg-muted p-3 text-xs overflow-auto max-h-48">
                {JSON.stringify(connectionResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Create Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Creare Contact</CardTitle>
            <CardDescription>Completează datele pentru a crea un lead în MiniCRM</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="FirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prenume *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ion" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="LastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nume *</FormLabel>
                        <FormControl>
                          <Input placeholder="Popescu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="Email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ion@exemplu.ro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="Phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon (opțional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+40 712 345 678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Trimite în MiniCRM
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Result */}
        {submitResult && (
          <Alert variant={submitResult.type === "success" ? "default" : "destructive"}>
            {submitResult.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>{submitResult.type === "success" ? "Success" : "Eroare"}</AlertTitle>
            <AlertDescription>
              <p className="mb-2">{submitResult.message}</p>
              <pre className="rounded-md bg-muted p-3 text-xs overflow-auto max-h-48">
                {JSON.stringify(submitResult.raw, null, 2)}
              </pre>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
