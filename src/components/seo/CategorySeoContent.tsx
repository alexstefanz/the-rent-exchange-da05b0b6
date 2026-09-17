import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategoryContent } from "@/data/categoryContent";

interface Props {
  /** Top-level category slug, e.g. "unelte". */
  categorySlug: string | undefined;
  /** Heading shown above the intro text. */
  heading: string;
  /** Optional extra lead paragraph (used on subcategory pages). */
  lead?: string;
}

/**
 * Unique on-page copy + FAQ for category and subcategory pages.
 * Keeps these pages from being near-duplicates for search engines
 * and answers the questions renters actually ask.
 */
const CategorySeoContent = ({ categorySlug, heading, lead }: Props) => {
  const { language } = useLanguage();
  const content = getCategoryContent(categorySlug);
  if (!content) return null;

  const paragraphs = language === "en" ? content.introEn : content.intro;

  return (
    <section className="mt-12 border-t border-border/60 pt-8">
      <h2 className="text-lg font-bold tracking-tight text-foreground">{heading}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground max-w-3xl">
        {lead ? <p>{lead}</p> : null}
        {paragraphs.map((p) => (
          <p key={p.slice(0, 32)}>{p}</p>
        ))}
      </div>

      <h3 className="mt-8 text-base font-semibold text-foreground">
        {language === "en" ? "Frequently asked questions" : "Întrebări frecvente"}
      </h3>
      <Accordion type="single" collapsible className="mt-2 max-w-3xl">
        {content.faq.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-sm">
              {language === "en" ? item.qEn : item.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              {language === "en" ? item.aEn : item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default CategorySeoContent;
