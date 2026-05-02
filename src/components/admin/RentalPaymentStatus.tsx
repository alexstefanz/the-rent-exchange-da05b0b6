import { useMemo } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Loader2, RefreshCw, ExternalLink, AlertTriangle, CheckCircle2, AlertCircle, Info, Activity, CreditCard, Receipt, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRentalPaymentStatus } from "@/hooks/queries/useRentalPaymentStatus";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const statusVariant: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  active: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  authorized: "bg-blue-100 text-blue-800 border-blue-200",
  captured: "bg-green-100 text-green-800 border-green-200",
  refunded: "bg-orange-100 text-orange-800 border-orange-200",
  paid: "bg-green-100 text-green-800 border-green-200",
};

const eventDot: Record<string, string> = {
  default: "bg-muted-foreground",
  success: "bg-green-500",
  warning: "bg-orange-500",
  error: "bg-red-500",
};

interface Props {
  rentalId: string;
  mode?: "admin" | "user";
}

export const RentalPaymentStatus = ({ rentalId, mode = "admin" }: Props) => {
  const qc = useQueryClient();
  const { data, isLoading, isFetching, error, refetch } = useRentalPaymentStatus(rentalId);

  const fmtRon = (n: number) =>
    new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON", minimumFractionDigits: 2 }).format(n);

  const fmtTs = (ts: string) => format(new Date(ts), "d MMM yyyy, HH:mm:ss", { locale: ro });

  const stripeDashUrl = useMemo(() => {
    const pi = data?.rental.payment_intent_id;
    if (!pi) return null;
    return `https://dashboard.stripe.com/payments/${pi}`;
  }, [data?.rental.payment_intent_id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6 text-sm text-destructive">
          Eroare la încărcare status plată: {(error as any)?.message ?? "necunoscută"}
        </CardContent>
      </Card>
    );
  }

  const showAdminFeatures = mode === "admin" && data.is_admin;
  const allTabs = ["timeline", ...(showAdminFeatures ? ["stripe", "transactions", "discrepancies"] : [])];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("border", statusVariant[data.rental.status] || statusVariant.pending)}>
            Status: {data.rental.status}
          </Badge>
          <Badge className={cn("border", statusVariant[data.rental.payment_status] || statusVariant.pending)}>
            Plată: {data.rental.payment_status === "captured" ? "Plătit" : data.rental.payment_status}
          </Badge>
          {showAdminFeatures && (
            data.is_synced ? (
              <Badge className="bg-green-100 text-green-800 border border-green-200 gap-1">
                <CheckCircle2 className="h-3 w-3" /> Sincronizat
              </Badge>
            ) : (
              <Badge className="bg-orange-100 text-orange-800 border border-orange-200 gap-1">
                <AlertTriangle className="h-3 w-3" /> Discrepanță
              </Badge>
            )
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Live
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            qc.invalidateQueries({ queryKey: ["rental-payment-status", rentalId] });
            refetch();
          }}
          disabled={isFetching}
        >
          <RefreshCw className={cn("h-4 w-4 mr-1", isFetching && "animate-spin")} />
          Reîmprospătează
        </Button>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="timeline" className="gap-1">
            <Activity className="h-3.5 w-3.5" /> Cronologie
          </TabsTrigger>
          {showAdminFeatures && (
            <>
              <TabsTrigger value="stripe" className="gap-1">
                <CreditCard className="h-3.5 w-3.5" /> Stripe
              </TabsTrigger>
              <TabsTrigger value="transactions" className="gap-1">
                <Receipt className="h-3.5 w-3.5" /> Tranzacții
              </TabsTrigger>
              <TabsTrigger value="discrepancies" className="gap-1">
                <ListChecks className="h-3.5 w-3.5" /> Discrepanțe
                {data.discrepancies.filter((d) => d.severity !== "info").length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                    {data.discrepancies.filter((d) => d.severity !== "info").length}
                  </Badge>
                )}
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Timeline */}
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {data.events.length === 0 ? (
                <p className="text-sm text-muted-foreground">Niciun eveniment înregistrat.</p>
              ) : (
                <ol className="relative border-l border-border ml-2 space-y-5">
                  {data.events.map((ev, idx) => (
                    <li key={`${ev.timestamp}-${idx}`} className="ml-4">
                      <span
                        className={cn(
                          "absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-background",
                          eventDot[ev.variant ?? "default"],
                        )}
                      />
                      <p className="text-sm font-medium text-foreground">{ev.label}</p>
                      <p className="text-xs text-muted-foreground">{fmtTs(ev.timestamp)}</p>
                      {ev.details && (
                        <p className="text-xs text-muted-foreground mt-1">{ev.details}</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stripe details */}
        {showAdminFeatures && (
          <TabsContent value="stripe" className="mt-4 space-y-4">
            {!data.stripe ? (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  Niciun Payment Intent asociat acestui rental.
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      Payment Intent
                      {stripeDashUrl && (
                        <a
                          href={stripeDashUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {data.stripe.payment_intent.id} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-sm">
                    <Field label="Status" value={data.stripe.payment_intent.status} />
                    <Field label="Capture method" value={data.stripe.payment_intent.capture_method} />
                    <Field label="Sumă autorizată" value={fmtRon(data.stripe.payment_intent.amount)} />
                    <Field label="Sumă încasată" value={fmtRon(data.stripe.payment_intent.amount_received)} />
                    <Field label="Capturable" value={fmtRon(data.stripe.payment_intent.amount_capturable)} />
                    <Field label="Creat" value={fmtTs(data.stripe.payment_intent.created)} />
                  </CardContent>
                </Card>

                {data.stripe.charge && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Charge</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3 text-sm">
                      <Field label="ID" value={data.stripe.charge.id} />
                      <Field label="Plătit" value={data.stripe.charge.paid ? "Da" : "Nu"} />
                      <Field label="Refund total" value={fmtRon(data.stripe.charge.amount_refunded)} />
                      <Field
                        label="Card"
                        value={
                          data.stripe.charge.card_brand
                            ? `${data.stripe.charge.card_brand} •••• ${data.stripe.charge.card_last4}`
                            : "—"
                        }
                      />
                      {data.stripe.charge.receipt_url && (
                        <div className="col-span-2">
                          <a
                            href={data.stripe.charge.receipt_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Vezi chitanță Stripe <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      {data.stripe.charge.last_error && (
                        <div className="col-span-2 rounded border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
                          {data.stripe.charge.last_error}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {data.stripe.refunds.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Refunds</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Sumă</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Motiv</TableHead>
                            <TableHead>Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.stripe.refunds.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-mono text-xs">{r.id}</TableCell>
                              <TableCell>{fmtRon(r.amount)}</TableCell>
                              <TableCell>{r.status}</TableCell>
                              <TableCell>{r.reason ?? "—"}</TableCell>
                              <TableCell className="text-xs">{fmtTs(r.created)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        )}

        {/* Transactions */}
        {showAdminFeatures && (
          <TabsContent value="transactions" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {!data.transactions || data.transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nicio tranzacție în baza de date.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tip</TableHead>
                        <TableHead>Sumă</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Descriere</TableHead>
                        <TableHead>Creat</TableHead>
                        <TableHead>Procesat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.transactions.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            <Badge variant="outline">{t.type}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{fmtRon(Number(t.amount))}</TableCell>
                          <TableCell>
                            <Badge className={cn("border", statusVariant[t.status] || "bg-muted")}>
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {t.description ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs">{t.created_at ? fmtTs(t.created_at) : "—"}</TableCell>
                          <TableCell className="text-xs">{t.processed_at ? fmtTs(t.processed_at) : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Discrepancies */}
        {showAdminFeatures && (
          <TabsContent value="discrepancies" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-2">
                {data.discrepancies.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" /> Totul sincronizat — niciun warning detectat.
                  </div>
                ) : (
                  data.discrepancies.map((d, i) => {
                    const Icon = d.severity === "error" ? AlertCircle : d.severity === "warning" ? AlertTriangle : Info;
                    const cls =
                      d.severity === "error"
                        ? "border-destructive/40 bg-destructive/5 text-destructive"
                        : d.severity === "warning"
                          ? "border-orange-200 bg-orange-50 text-orange-800"
                          : "border-blue-200 bg-blue-50 text-blue-800";
                    return (
                      <div key={i} className={cn("flex items-start gap-2 rounded-md border p-3 text-sm", cls)}>
                        <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">{d.message}</p>
                          <p className="text-xs opacity-70 mt-0.5 font-mono">{d.code}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string | number }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-medium break-all">{value}</p>
  </div>
);

export default RentalPaymentStatus;