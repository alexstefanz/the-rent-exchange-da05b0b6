import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, MessageSquare, Moon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface Prefs {
  push: boolean;
  email: boolean;
  sms: boolean;
  quietHours: boolean;
}

const KEY = "rentli.notification.prefs";

function load(): Prefs {
  if (typeof window === "undefined") return { push: true, email: true, sms: true, quietHours: false };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Prefs;
  } catch { /* noop */ }
  return { push: true, email: true, sms: true, quietHours: false };
}

export function NotificationSettingsSheet({ open, onOpenChange }: Props) {
  const { t } = useLanguage();
  const [prefs, setPrefs] = useState<Prefs>(() => load());

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    }
  }, [prefs]);

  const items: { key: keyof Prefs; icon: typeof Bell; titleRo: string; titleEn: string; descRo: string; descEn: string }[] = [
    {
      key: "push",
      icon: Bell,
      titleRo: "Notificări push",
      titleEn: "Push notifications",
      descRo: "Primești alerte pe acest dispozitiv.",
      descEn: "Get alerts on this device.",
    },
    {
      key: "email",
      icon: Mail,
      titleRo: "Email",
      titleEn: "Email",
      descRo: "Rezumate și actualizări importante.",
      descEn: "Summaries and important updates.",
    },
    {
      key: "sms",
      icon: MessageSquare,
      titleRo: "SMS",
      titleEn: "SMS",
      descRo: "Doar pentru evenimente critice.",
      descEn: "Only for critical events.",
    },
    {
      key: "quietHours",
      icon: Moon,
      titleRo: "Ore de liniște (22:00 – 08:00)",
      titleEn: "Quiet hours (10pm – 8am)",
      descRo: "Notificările sunt amânate până dimineața.",
      descEn: "Notifications are paused until morning.",
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle>{t("Setări notificări", "Notification settings")}</SheetTitle>
          <SheetDescription>
            {t(
              "Alege cum vrei să fii anunțat de Rentli.",
              "Choose how you want Rentli to reach you.",
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 pb-6 space-y-2">
          {items.map(({ key, icon: Icon, titleRo, titleEn, descRo, descEn }) => (
            <label
              key={key}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3 cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <span className="shrink-0 h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold">{t(titleRo, titleEn)}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">{t(descRo, descEn)}</span>
              </span>
              <Switch
                checked={prefs[key]}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))}
              />
            </label>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}