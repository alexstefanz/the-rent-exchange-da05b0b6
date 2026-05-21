import { Link } from "react-router-dom";
import { ThumbsUp, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FreeCancellationNotice = () => {
  const { language } = useLanguage();
  return (
    <div className="rounded-xl border border-border bg-card px-4">
      <Accordion type="single" collapsible>
        <AccordionItem value="free-cancellation" className="border-b-0">
          <AccordionTrigger className="py-4 hover:no-underline [&>svg]:hidden group">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                <ThumbsUp className="h-4 w-4 text-primary" />
              </div>
              <p className="font-semibold text-foreground text-sm text-left">
                {language === "ro" ? "Anulare gratuită" : "Free cancellation"}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </AccordionTrigger>
          <AccordionContent className="pb-4 pt-0 pl-12">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === "ro"
                ? "Anulare gratuită cu 24h înainte de start. Sub 24h, prima zi și taxa platformei nu se rambursează. După predarea produsului, rezervarea nu mai poate fi anulată — există returnare anticipată sau dispută. Vezi"
                : "Free cancellation up to 24h before start. Under 24h, the first day and platform fee are non-refundable. After handover, cancellation is no longer possible — only early return or dispute. See the"}{" "}
              <Link to="/politica-anulare" className="text-primary hover:underline font-medium">
                {language === "ro" ? "politica de anulare" : "cancellation policy"}
              </Link>{" "}
              {language === "ro" ? "pentru mai multe detalii." : "for more details."}
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default FreeCancellationNotice;