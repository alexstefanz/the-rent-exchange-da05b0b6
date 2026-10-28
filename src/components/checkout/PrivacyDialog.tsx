import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { sectionsRo, sectionsEn } from "@/pages/legal/PrivacyPolicy";
import { useLanguage } from "@/contexts/LanguageContext";

interface PrivacyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PrivacyDialog = ({ open, onOpenChange }: PrivacyDialogProps) => {
  const { t, language } = useLanguage();
  const sections = language === "en" ? sectionsEn : sectionsRo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col p-0 gap-0 w-[95vw] sm:w-full">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border">
          <DialogTitle className="text-lg sm:text-xl">
            {t("Politica de Confidențialitate", "Privacy Policy")}
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t(
              "Cum colectăm, folosim și protejăm datele tale personale.",
              "How we collect, use and protect your personal data.",
            )}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 min-h-0" style={{ maxHeight: "55vh" }}>
          <div className="space-y-6">
            {sections.map((section, i) => (
              <div key={section.id}>
                <h3 className="font-semibold text-foreground mb-2">{i + 1}. {section.title}</h3>
                <div className="text-sm text-muted-foreground">{section.content}</div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border">
          <Button onClick={() => onOpenChange(false)} className="w-full" size="lg">
            {t("Am înțeles", "Got it")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyDialog;