import { Check, ListChecks } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import ProductIncludes from "./ProductIncludes";
import UsageRules from "./UsageRules";

interface Props {
  description?: string | null;
  includedItems?: string[];
  usageRules?: string[];
}

const ProductInfoAccordion = ({ description, includedItems, usageRules }: Props) => {
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <Accordion type="multiple" defaultValue={["description"]} className="w-full">
        <AccordionItem value="description" className="border-b">
          <AccordionTrigger className="px-5 py-4 hover:no-underline font-heading text-base font-semibold">
            {t("Descriere", "Description")}
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-4 text-sm text-muted-foreground whitespace-pre-wrap break-words">
            {description || t("Fără descriere disponibilă.", "No description available.")}
          </AccordionContent>
        </AccordionItem>

        {includedItems && includedItems.length > 0 && (
          <AccordionItem value="included" className="border-b">
            <AccordionTrigger className="px-5 py-4 hover:no-underline font-heading text-base font-semibold">
              {t("Ce e inclus", "What's included")}
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-4">
              <div className="-mx-5 -mb-4">
                <ProductIncludes items={includedItems} />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {usageRules && usageRules.length > 0 && (
          <AccordionItem value="usage-rules" className="border-b">
            <AccordionTrigger className="px-5 py-4 hover:no-underline font-heading text-base font-semibold">
              {t("Regulile proprietarului", "Owner's rules")}
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-4">
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 font-heading text-xl font-semibold text-foreground flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  {t("Regulile proprietarului", "Owner's rules")}
                </h2>
                <ul className="space-y-3">
                  {usageRules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <Check className="h-3 w-3 text-emerald-600" />
                      </div>
                      <span className="text-sm text-muted-foreground">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="rules" className="border-b-0">
          <AccordionTrigger className="px-5 py-4 hover:no-underline font-heading text-base font-semibold">
            {t("Reguli & politici", "Rules & policies")}
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-4">
            <div className="-mx-5 -mb-4">
              <UsageRules />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ProductInfoAccordion;
