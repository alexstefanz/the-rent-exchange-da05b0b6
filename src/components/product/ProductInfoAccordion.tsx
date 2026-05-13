import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import ProductIncludes from "./ProductIncludes";
import UsageRules from "./UsageRules";

interface Props {
  description?: string | null;
  includedItems?: string[];
}

const ProductInfoAccordion = ({ description, includedItems }: Props) => {
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
