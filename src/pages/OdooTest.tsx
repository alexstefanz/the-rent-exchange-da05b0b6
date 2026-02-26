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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Wifi, WifiOff, Send, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

const leadSchema = z.object({
  name: z.string().min(1, "Numele lead-ului este obligatoriu").max(200),
  contact_name: z.string().max(200).optional().or(z.literal("")),
  email_from: z.string().email("Email invalid").optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  expected_revenue: z.string().optional().or(z.literal("")),
});

type LeadFormData = z.infer<typeof leadSchema>;

type OdooLead = {
  id: number;
  name: string;
  contact_name: string | false;
  email_from: string | false;
  phone: string | false;
  stage_id: [number, string] | false;
  expected_revenue: number;
  create_date: string;
};

type ApiResult = {
  type: "success" | "error";
  message: string;
  raw: unknown;
};

const callOdooProxy = async (action: string, data?: Record<string, unknown>) => {
  const { data: result, error } = await supabase.functions.invoke("odoo-proxy", {
    body: { action, data },
  });
  if (error) throw error;
  return result;
};

export default function OdooTest() {
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "loading" | "connected" | "error">("idle");
  const [connectionResult, setConnectionResult] = useState<unknown>(null);
  const [leads, setLeads] = useState<OdooLead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<ApiResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", contact_name: "", email_from: "", phone: "", expected_revenue: "" },
  });

  const testConnection = async () => {
    setConnectionStatus("loading");
    setConnectionResult(null);
    try {
      const result = await callOdooProxy("test-connection");
      setConnectionResult(result);
      setConnectionStatus(result.success && result.connected ? "connected" : "error");
    } catch (err: unknown) {
      setConnectionResult(err);
      setConnectionStatus("error");
    }
  };

  const loadLeads = async () => {
    setLeadsLoading(true);
    setLeadsError(null);
    try {
      const result = await callOdooProxy("list-leads", { limit: 20 });
      if (result.success) {
        setLeads(result.leads || []);
      } else {
        setLeadsError(result.error || "Eroare necunoscută");
      }
    } catch (err: unknown) {
      setLeadsError(err instanceof Error ? err.message : "Eroare de rețea");
    } finally {
      setLeadsLoading(false);
    }
  };

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    setSubmitResult(null);
    try {
      const payload: Record<string, unknown> = { name: data.name };
      if (data.contact_name) payload.contact_name = data.contact_name;
      if (data.email_from) payload.email_from = data.email_from;
      if (data.phone) payload.phone = data.phone;
      if (data.expected_revenue) payload.expected_revenue = data.expected_revenue;

      const result = await callOdooProxy("create-lead", payload);
      setSubmitResult({
        type: result.success ? "success" : "error",
        message: result.success
          ? `Lead creat cu succes (ID: ${result.leadId})`
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
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Odoo CRM Integration Test</h1>
          <p className="text-muted-foreground mt-1">POC — conexiune, listare și creare leads în Odoo CRM via JSON-RPC 2.0</p>
        </div>

        {/* Test Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conexiune Odoo</CardTitle>
            <CardDescription>Verifică autentificarea cu API Key la instanța Odoo</CardDescription>
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
              {connectionStatus === "error" && <Badge variant="destructive">Error</Badge>}
            </div>
            {connectionResult && (
              <pre className="rounded-md bg-muted p-3 text-xs overflow-auto max-h-48">
                {JSON.stringify(connectionResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* List Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leads existente</CardTitle>
            <CardDescription>Citește lead-urile din Odoo CRM (ultimele 20)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={loadLeads} disabled={leadsLoading} variant="outline">
              {leadsLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Încarcă Leads
            </Button>
            {leadsError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Eroare</AlertTitle>
                <AlertDescription>{leadsError}</AlertDescription>
              </Alert>
            )}
            {leads.length > 0 && (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nume Lead</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Etapă</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-mono text-xs">{lead.id}</TableCell>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>{lead.contact_name || "—"}</TableCell>
                        <TableCell>{lead.email_from || "—"}</TableCell>
                        <TableCell>{lead.phone || "—"}</TableCell>
                        <TableCell>
                          {Array.isArray(lead.stage_id) ? lead.stage_id[1] : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {lead.expected_revenue ? `€${lead.expected_revenue}` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Lead Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Creare Lead</CardTitle>
            <CardDescription>Creează un lead nou în Odoo CRM</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nume Lead *</FormLabel>
                    <FormControl><Input placeholder="Oportunitate nouă" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="contact_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact</FormLabel>
                      <FormControl><Input placeholder="Ion Popescu" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email_from" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" placeholder="ion@exemplu.ro" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl><Input placeholder="+40 712 345 678" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="expected_revenue" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revenue estimat (€)</FormLabel>
                      <FormControl><Input type="number" placeholder="5000" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                  Trimite în Odoo CRM
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Result */}
        {submitResult && (
          <Alert variant={submitResult.type === "success" ? "default" : "destructive"}>
            {submitResult.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
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
