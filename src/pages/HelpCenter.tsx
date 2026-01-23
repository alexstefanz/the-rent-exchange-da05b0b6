import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, HelpCircle, MessageCircle, FileText, ChevronRight, BookOpen, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

const HelpCenter = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      icon: FileText,
      title: t("Întrebări frecvente", "FAQ"),
      description: t("Găsește răspunsuri la cele mai comune întrebări", "Find answers to the most common questions"),
      link: "/centru-asistenta/faq",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: MessageCircle,
      title: t("Asistență & Contact", "Support & Contact"),
      description: t("Contactează echipa noastră pentru ajutor personalizat", "Contact our team for personalized help"),
      link: "/centru-asistenta/contact",
      color: "bg-accent/10 text-accent",
    },
    {
      icon: BookOpen,
      title: t("Ghiduri & Tutoriale", "Guides & Tutorials"),
      description: t("Învață cum să folosești platforma eficient", "Learn how to use the platform efficiently"),
      link: "/centru-asistenta/ghiduri",
      color: "bg-secondary text-secondary-foreground",
    },
  ];

  const popularArticles = [
    {
      title: t("Cum să închiriez un produs?", "How do I rent a product?"),
      category: "FAQ",
    },
    {
      title: t("Cum să adaug un anunț?", "How do I add a listing?"),
      category: "Ghiduri",
    },
    {
      title: t("Politica de anulare", "Cancellation policy"),
      category: "Reguli",
    },
    {
      title: t("Metode de plată acceptate", "Accepted payment methods"),
      category: "Plăți",
    },
    {
      title: t("Cum funcționează verificarea utilizatorilor?", "How does user verification work?"),
      category: "Siguranță",
    },
    {
      title: t("Ce fac dacă am o problemă cu produsul?", "What if I have a problem with the product?"),
      category: "Asistență",
    },
  ];

  const filteredArticles = popularArticles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 lg:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center">
            <HelpCircle className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h1 className="mb-4 text-3xl font-bold tracking-tight lg:text-4xl">
              {t("Centru de Asistență", "Help Center")}
            </h1>
            <p className="mb-8 text-muted-foreground">
              {t(
                "Cum te putem ajuta astăzi? Caută răspunsuri sau contactează-ne.",
                "How can we help you today? Search for answers or contact us."
              )}
            </p>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("Caută ajutor...", "Search for help...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 text-base shadow-soft"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12">
        <div className="container px-4">
          <div className="grid gap-6 md:grid-cols-3">
            {categories.map((category) => (
              <Link key={category.title} to={category.link}>
                <Card className="group h-full transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
                  <CardHeader>
                    <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg ${category.color}`}>
                      <category.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="flex items-center justify-between text-lg">
                      {category.title}
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles Section */}
      <section className="bg-muted/30 py-12">
        <div className="container px-4">
          <h2 className="mb-6 text-xl font-semibold">
            {t("Articole populare", "Popular articles")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {filteredArticles.map((article, index) => (
              <Link
                key={index}
                to="#"
                className="group flex items-center justify-between rounded-lg bg-background p-4 shadow-card transition-all hover:shadow-card-hover"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {article.title}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{article.category}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12">
        <div className="container px-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="flex flex-col items-center gap-6 py-8 text-center md:flex-row md:text-left">
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold">
                  {t("Nu ai găsit ce căutai?", "Didn't find what you were looking for?")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "Echipa noastră de suport este disponibilă să te ajute.",
                    "Our support team is available to help you."
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" />
                  {t("Trimite email", "Send email")}
                </Button>
                <Button className="gap-2">
                  <Phone className="h-4 w-4" />
                  {t("Sună-ne", "Call us")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HelpCenter;
