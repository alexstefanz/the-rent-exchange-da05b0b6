import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { FileText, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: Section[];
  forceRomanianLabels?: boolean;
  intro?: React.ReactNode;
}

const LegalPageLayout = ({ title, subtitle, lastUpdated, sections, forceRomanianLabels = false, intro }: LegalPageLayoutProps) => {
  const { language } = useLanguage();
  const isEnglish = language === "en" && !forceRomanianLabels;
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border-b border-border">
        <div className="container py-10 md:py-16">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground transition-colors">{isEnglish ? "Home" : "Acasă"}</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">{title}</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="hidden md:flex h-14 w-14 rounded-2xl bg-primary/10 items-center justify-center shrink-0">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-heading font-bold text-foreground">{title}</h1>
              {subtitle && <p className="text-muted-foreground mt-2 max-w-2xl">{subtitle}</p>}
              <Badge variant="secondary" className="mt-3">
                {isEnglish ? "Last updated" : "Ultima actualizare"}: {lastUpdated}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8 md:py-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <Card className="p-4">
                <h3 className="font-heading font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">{isEnglish ? "Table of contents" : "Cuprins"}</h3>
                <nav className="space-y-1">
                  {sections.map((section, i) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className="w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex items-center gap-2"
                    >
                      <span className="text-primary font-semibold text-xs">{i + 1}.</span>
                      <span className="truncate">{section.title}</span>
                    </button>
                  ))}
                </nav>
              </Card>
            </div>
          </aside>

          {/* Main content */}
          <div>
            {intro && (
              <Card className="p-5 mb-3 text-muted-foreground leading-relaxed text-sm">{intro}</Card>
            )}
            <Accordion type="multiple" defaultValue={sections.map(s => s.id)} className="space-y-3">
              {sections.map((section, i) => (
                <AccordionItem key={section.id} value={section.id} id={section.id} className="border rounded-lg px-5 bg-card">
                  <AccordionTrigger className="hover:no-underline text-left">
                    <span className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-heading font-semibold text-base">{section.title}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed prose-sm">
                    {section.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LegalPageLayout;
