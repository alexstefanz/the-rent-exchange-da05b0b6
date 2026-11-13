import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { categories } from "@/data/categories";
import { getCategoryIcon } from "@/data/categoryIcons";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategoryCounts } from "@/hooks/queries/useCategoryCounts";
import { usePageSeo } from "@/hooks/usePageSeo";

const Categories = () => {
  const copy = useUxCopy();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const categoryCounts = useCategoryCounts();

  usePageSeo({
    title: language === "en"
      ? "All rental categories in Romania | Rentli"
      : "Toate categoriile de închirieri din România | Rentli",
    description: language === "en"
      ? "Browse 12 rental categories: tools, events, electronics, gardening, camping, sport, travel, trailers, costumes and heavy equipment."
      : "Explorează 12 categorii de închirieri: unelte, evenimente, electronice, grădinărit, camping, sport, călătorii, remorci, costume și utilaje.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: language === "en" ? "Rental categories" : "Categorii de închirieri",
      url: "https://rentli.ro/categorii",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: categories.length,
        itemListElement: categories.map((category, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: language === "en" ? (category.nameEn || category.name) : category.name,
          url: `https://rentli.ro/categorie/${category.slug}`,
        })),
      },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: language === "en" ? "Home" : "Acasă", item: "https://rentli.ro/" },
          { "@type": "ListItem", position: 2, name: language === "en" ? "Categories" : "Categorii", item: "https://rentli.ro/categorii" },
        ],
      },
    },
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
                to={`/categorie/${category.slug}`}
                className="group flex flex-col items-center rounded-xl bg-card p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md animate-fade-up"
                style={{ boxShadow: 'rgba(35, 29, 26, 0.08) 0px 4px 20px -4px', animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
              >
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">{name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {count} {language === "en" ? (count === 1 ? "listing" : "listings") : (count === 1 ? "anunț" : "anunțuri")}
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
