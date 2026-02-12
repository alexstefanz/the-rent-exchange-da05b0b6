import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { categories } from "@/data/categories";
import { getCategoryIcon } from "@/data/categoryIcons";
import { useUxCopy } from "@/hooks/useUxCopy";

const colors = ["bg-yellow-100","bg-blue-100","bg-amber-100","bg-orange-100","bg-indigo-100","bg-emerald-100","bg-pink-100","bg-cyan-100","bg-rose-100"];

const Categories = () => {
  const copy = useUxCopy();
  const [searchQuery, setSearchQuery] = useState("");
  const filteredCategories = categories.filter(
    (cat) => cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || cat.subcategories.some((sub) => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">{copy.categories_page.title}</h1>
          <p className="mt-2 text-muted-foreground">{copy.categories_page.subtitle}</p>
        </div>
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder={copy.categories_page.searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
          {filteredCategories.map((category, index) => {
            const Icon = getCategoryIcon(category.id);
            const colorClass = colors[index % colors.length];
            const nameParts = category.name.split(" & ");
            return (
              <Link key={category.id} to={`/categorie/${category.id}`} className="group flex flex-col items-center gap-2 animate-fade-up" style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}>
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${colorClass} transition-transform duration-200 group-hover:scale-110 sm:h-20 sm:w-20`}>
                  <Icon className="h-8 w-8 text-foreground sm:h-10 sm:w-10" />
                </div>
                <div className="text-center">
                  <span className="block text-xs font-medium text-foreground sm:text-sm">{nameParts[0]}</span>
                  {nameParts[1] && <span className="block text-xs text-muted-foreground">{nameParts[1]}</span>}
                  <span className="block text-[10px] text-muted-foreground sm:text-xs">{copy.categories_page.subcategories(category.subcategories.length)}</span>
                </div>
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
