import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { showSaveToast } from "@/lib/saveToast";
import { Loader2 } from "lucide-react";

interface Prefs {
  email_marketing: boolean;
  sms_marketing: boolean;
  email_transactional: boolean;
  sms_transactional: boolean;
}

const DEFAULTS: Prefs = {
  email_marketing: false,
  sms_marketing: false,
  email_transactional: true,
  sms_transactional: true,
};

const NotificationPreferences = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle();
      if (data) setPrefs({
        email_marketing: data.email_marketing,
        sms_marketing: data.sms_marketing,
        email_transactional: data.email_transactional,
        sms_transactional: data.sms_transactional,
      });
      setLoading(false);
    })();
  }, [user]);

  const update = async (patch: Partial<Prefs>) => {
    if (!user) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setSaving(true);
    const { error } = await supabase.from("notification_preferences").upsert({ user_id: user.id, ...next });
    setSaving(false);
    if (error) toast({ title: "Eroare la salvare", description: error.message, variant: "destructive" });
    else showSaveToast("Preferințe actualizate");
  };

  if (!user) return <div className="container py-12">Trebuie să fii autentificat.</div>;
  if (loading) return <div className="container py-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const Row = ({ k, label, desc }: { k: keyof Prefs; label: string; desc: string }) => (
    <div className="flex items-start justify-between gap-4 py-4 border-b last:border-0">
      <div>
        <Label className="font-semibold">{label}</Label>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={prefs[k]} onCheckedChange={(v) => update({ [k]: v } as Partial<Prefs>)} disabled={saving} />
    </div>
  );

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-3xl font-bold mb-2">Notificări</h1>
      <p className="text-muted-foreground mb-6">
        Gestionează cum primești notificările Rentli. Notificările critice de siguranță (proces verbal, dispute, predare) nu pot fi dezactivate.
      </p>
      <Card className="p-6">
        <Row k="email_transactional" label="Email — actualizări închirieri" desc="Confirmări de cereri, acceptări, predări și finalizări." />
        <Row k="email_chat" label="Email — chat & mesaje" desc="Primești un email când ai un mesaj nou în chat." />
        <Row k="sms_transactional" label="SMS tranzacțional" desc="Notificări scurte cu link direct către acțiune." />
      </Card>
    </div>
  );
};

export default NotificationPreferences;