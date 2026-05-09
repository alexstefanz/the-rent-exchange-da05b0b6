import { Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  onAsk: (message: string) => void;
}

const QuickQuestionsChips = ({ onAsk }: Props) => {
  const { t } = useLanguage();
  const questions = [
    { ro: "E disponibil în weekend?", en: "Is it available this weekend?" },
    { ro: "Include accesoriile?", en: "Are accessories included?" },
    { ro: "Există posibilitate de livrare?", en: "Is delivery possible?" },
    { ro: "Pickup-ul e flexibil?", en: "Is pickup flexible?" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("Întrebări rapide", "Quick questions")}</h3>
          <p className="text-xs text-muted-foreground">{t("Apasă pentru a trimite întrebarea proprietarului", "Tap to send the question to the owner")}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((q) => (
          <button
            key={q.ro}
            onClick={() => onAsk(t(q.ro, q.en))}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary border border-border transition-colors"
          >
            {t(q.ro, q.en)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickQuestionsChips;
