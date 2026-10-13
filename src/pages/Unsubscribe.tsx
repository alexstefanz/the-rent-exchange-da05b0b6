import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MailX } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Unsubscribe is now hosted by the email provider (link in every email footer).
// This page only serves older links.
const Unsubscribe = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <MailX className="h-10 w-10 mx-auto text-primary mb-2" />
          <CardTitle>{t("Dezabonare email", "Email unsubscribe")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground text-sm">
          {t(
            "Acest link nu mai este activ. Pentru dezabonare folosește linkul „Dezabonare” din subsolul celui mai recent email primit de la Rentli.",
            "This link is no longer active. To unsubscribe, use the “Unsubscribe” link in the footer of the most recent Rentli email."
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
