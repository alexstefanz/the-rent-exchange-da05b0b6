import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { categories } from "@/data/categories";
import { getCategoryIcon } from "@/data/categoryIcons";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const Categories = () => {
  const copy = useUxCopy();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categoryCounts } = useQuery({
    queryKey: ["category-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("category")
        .eq("is_active", true);
      if (error) return {};
      const counts: Record<string, number> = {};
      data?.forEach((p) => {
        if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
      });
      return counts;
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.subcategories.some(
        (sub) =>
          sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sub.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            {copy.categories_page.title}
          </h1>
          <p className="mt-2 text-muted-foreground">{copy.categories_page.subtitle}</p>
        </div>
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={copy.categories_page.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {filteredCategories.map((category, index) => {
            const Icon = getCategoryIcon(category.id);
            const name = language === "en" ? category.nameEn : category.name;
            const count = categoryCounts?.[category.name] || 0;
            return (
              <Link
                key={category.id}
                to={`/categorie/${category.id}`}
                className="group flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md animate-fade-up"
                style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
              >
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">{name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {count} {language === "en" ? "listings" : "anunțuri"}
                </p>
              </Link>
            );
          })}
        </div>
        {filteredCategories.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">{copy.categories_page.noResults}</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Categories;
