import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, Clock, Copy, MessageSquare, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

const fmt = (d?: string | null) => (d ? format(new Date(d), "dd.MM.yyyy HH:mm:ss") : "—");

export default function AdminContractAuditTab({ rental }: { rental: any }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-contract-audit", rental.id],
    queryFn: async () => {
      const [acc, sms] = await Promise.all([
        supabase.from("rental_contract_acceptances")
          .select("role, user_id, accepted_at, validated_at, validation_channel, validation_destination, validation_ref, user_agent, signature_data")
          .eq("rental_id", rental.id),
        supabase.from("sms_logs")
          .select("id, created_at, user_id, recipient_phone, status, provider_message_id, error_message")
          .eq("rental_id", rental.id).eq("template_key", "contract_otp")
          .order("created_at", { ascending: false }).limit(50),
      ]);
      if (acc.error) throw acc.error;
      return { acc: acc.data ?? [], sms: sms.data ?? [] };
    },
  });

  const copy = (v: string) => navigator.clipboard?.writeText(v).then(() => toast.success(`Copiat: ${v}`));

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const parties = [
    { role: "owner", label: "Locator (Proprietar)", name: rental.owner_name },
    { role: "renter", label: "Locatar (Chiriaș)", name: rental.renter_name },
  ];
  const both = parties.every((p) => data?.acc.some((a) => a.role === p.role));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Contract {rental.public_id}</span>
        <Badge variant={both ? "default" : "secondary"} className="ml-auto">
          {both ? "Semnat de ambele părți" : "Semnare incompletă"}
        </Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {parties.map((p) => {
          const a = data?.acc.find((x) => x.role === p.role);
          return (
            <div key={p.role} className="rounded-lg border bg-card p-3 text-sm space-y-1.5">
              <div className="flex items-center gap-2">
                {a ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                <span className="font-semibold">{p.label}</span>
              </div>
              <p className="text-muted-foreground">{p.name || "—"}</p>
              {a ? (
                <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-xs">
                  <dt className="text-muted-foreground">Acceptat</dt><dd>{fmt(a.accepted_at)}</dd>
                  <dt className="text-muted-foreground">Cod validat</dt><dd>{fmt(a.validated_at)}</dd>
                  <dt className="text-muted-foreground">Canal</dt><dd>{a.validation_channel === "sms" ? "Cod SMS" : "Fără validare SMS (semnare veche)"}</dd>
                  <dt className="text-muted-foreground">Telefon</dt><dd>{a.validation_destination || "—"}</dd>
                  <dt className="text-muted-foreground">Referință</dt>
                  <dd>{a.validation_ref ? (
                    <button type="button" onClick={() => copy(a.validation_ref!)} className="font-mono font-bold text-primary inline-flex items-center gap-1 hover:underline">
                      {a.validation_ref}<Copy className="h-3 w-3" />
                    </button>) : "—"}</dd>
                  <dt className="text-muted-foreground">ID utilizator</dt><dd className="font-mono break-all">{a.user_id}</dd>
                  <dt className="text-muted-foreground">Dispozitiv</dt><dd className="break-all">{a.user_agent || "—"}</dd>
                </dl>
              ) : <p className="text-xs text-muted-foreground">Nu a semnat încă.</p>}
              {a?.signature_data && (
                <a href={a.signature_data} target="_blank" rel="noopener noreferrer" className="block rounded border bg-background p-2">
                  <img src={a.signature_data} alt={`Semnătura ${p.label}`} className="max-h-20 mx-auto" />
                </a>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border bg-card p-3">
        <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />Jurnal SMS coduri contract
        </p>
        {!data?.sms.length ? <p className="text-xs text-muted-foreground">Niciun SMS trimis.</p> : (
          <ul className="space-y-1 text-xs">
            {data.sms.map((s) => (
              <li key={s.id} className="flex flex-wrap gap-x-3 border-b last:border-0 py-1">
                <span>{fmt(s.created_at)}</span>
                <span>{s.user_id === rental.owner_id ? "Proprietar" : s.user_id === rental.renter_id ? "Chiriaș" : "—"}</span>
                <span className="font-mono">{s.recipient_phone}</span>
                <Badge variant={s.status === "sent" ? "default" : "destructive"} className="h-5">{s.status === "sent" ? "Trimis" : "Eșuat"}</Badge>
                {s.provider_message_id && <span className="text-muted-foreground">ID operator: {s.provider_message_id}</span>}
                {s.error_message && <span className="text-destructive">{s.error_message}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
