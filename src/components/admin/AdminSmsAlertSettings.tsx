import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const EVENTS: { key: string; label: string }[] = [
  { key: "ticket_opened", label: "Tichete noi" },
  { key: "dispute_opened", label: "Dispute deschise" },
  { key: "cancellation_requested", label: "Cereri de anulare" },
  { key: "withdrawal_requested", label: "Cereri de retragere fonduri" },
  { key: "product_pending", label: "Produse în moderare" },
  { key: "kyc_needs_review", label: "KYC — revizuire manuală" },
  { key: "kyc_submitted", label: "KYC trimis" },
  { key: "sla_breach", label: "SLA depășit" },
  { key: "new_user_signup", label: "Utilizatori noi" },
];

interface Settings {
  enabled: boolean;
  event_types: string[];
  high_priority_only: boolean;
  extra_phones: string[];
  notify_all_admins: boolean;
}

export default function AdminSmsAlertSettings() {
  const [s, setS] = useState<Settings | null>(null);
  const [phones, setPhones] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("admin_sms_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) { setS(data as Settings); setPhones((data.extra_phones ?? []).join(", ")); }
    });
  }, []);

  if (!s) return null;

  const toggleEvent = (k: string) =>
    setS({ ...s, event_types: s.event_types.includes(k) ? s.event_types.filter((e) => e !== k) : [...s.event_types, k] });

  const save = async () => {
    setSaving(true);
    const extra_phones = phones.split(/[,\n;]/).map((p) => p.trim()).filter(Boolean);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("admin_sms_settings")
      .update({ ...s, extra_phones, updated_at: new Date().toISOString(), updated_by: u.user?.id ?? null })
      .eq("id", 1);
    setSaving(false);
    if (error) toast.error("Nu am putut salva setările");
    else toast.success("Setările SMS au fost salvate");
  };

  return (
    <Card>
      <CardHeader className="p-4 md:p-6 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" /> Alerte SMS pentru administratori
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0 space-y-4">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">Trimite SMS la notificări noi</span>
          <Switch checked={s.enabled} onCheckedChange={(v) => setS({ ...s, enabled: v })} />
        </label>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {EVENTS.map((e) => (
            <label key={e.key} className="flex items-center gap-2 text-sm">
              <Checkbox checked={s.event_types.includes(e.key)} onCheckedChange={() => toggleEvent(e.key)} />
              {e.label}
            </label>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={s.high_priority_only} onCheckedChange={(v) => setS({ ...s, high_priority_only: !!v })} />
          Trimite și pentru orice notificare cu prioritate ridicată
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={s.notify_all_admins} onCheckedChange={(v) => setS({ ...s, notify_all_admins: !!v })} />
          Trimite tuturor administratorilor cu telefon verificat
        </label>
        <div className="space-y-1">
          <span className="text-sm font-medium">Numere suplimentare (separate prin virgulă)</span>
          <Input value={phones} onChange={(e) => setPhones(e.target.value)} placeholder="07xx xxx xxx, 07yy yyy yyy" />
        </div>
        <p className="text-xs text-muted-foreground">
          Pentru a evita spamul, același tip de alertă nu se retrimite aceluiași număr mai des de o dată la 10 minute (excepție: prioritate ridicată).
        </p>
        <Button onClick={save} disabled={saving} size="sm">{saving ? "Se salvează…" : "Salvează"}</Button>
      </CardContent>
    </Card>
  );
}
