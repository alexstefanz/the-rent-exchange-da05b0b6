import { useState } from "react";
import { ChevronDown, MessageSquare, Sparkles } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const OptionalMessageCard = ({ value, onChange }: Props) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const templates = [
    t("Este disponibil pentru ridicare azi?", "Is it available for pickup today?"),
    t("Include accesoriile?", "Are accessories included?"),
    t("Pot veni seara?", "Can I come in the evening?"),
  ];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card rounded-2xl border border-border overflow-hidden transition-all">
        <CollapsibleTrigger asChild>
          <button className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium text-foreground text-sm">
                  {t("Vrei să trimiți un mesaj proprietarului?", "Want to send a message to the owner?")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("Opțional · Te ajută să primești un răspuns mai rapid", "Optional · Helps you get a faster reply")}
                </div>
              </div>
            </div>
            <ChevronDown
              className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className="px-5 pb-5 pt-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                <Sparkles className="h-3 w-3 text-primary" />
                {t("Sugestii rapide", "Quick suggestions")}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {templates.map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => onChange(tpl)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all"
                >
                  {tpl}
                </button>
              ))}
            </div>
            <Textarea
              placeholder={t(
                "Scrie un mesaj scurt pentru proprietar...",
                "Write a short message for the owner..."
              )}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="min-h-[90px] resize-none"
              maxLength={500}
            />
            <div className="flex justify-end text-[11px] text-muted-foreground">{value.length}/500</div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default OptionalMessageCard;