import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Search, Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { categories } from "@/data/categories";
import { getCategoryIcon } from "@/data/categoryIcons";
import logoImage from "@/assets/rentnow_logo.png";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<number | null>(null);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<number | null>(null);
  const handleMegaMenuEnter = (categoryId: number) => {
    setActiveMegaMenu(categoryId);
  };
  const handleMegaMenuLeave = () => {
    setActiveMegaMenu(null);
  };
  const toggleMobileCategory = (categoryId: number) => {
    setExpandedMobileCategory(expandedMobileCategory === categoryId ? null : categoryId);
  };
  const activeCategory = categories.find(c => c.id === activeMegaMenu);
  return <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md">
      {/* Main navbar */}
      <div className="container h-16 flex items-center justify-between gap-[10px] px-[10px]">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <img src={logoImage} alt="RentNow" className="h-10 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-4 lg:flex">
          <Link to="/cauta" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
            <Search className="h-4 w-4" />
            Caută
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hidden lg:flex">
            Autentificare
          </Button>
          <Button size="sm" asChild>
            <Link to="/adauga-anunt">
              <Plus className="h-4 w-4" />
              Adaugă
            </Link>
          </Button>
          
          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden bg-black text-white">
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Categories bar - Desktop */}
      <div className="hidden border-t border-border/40 bg-background lg:block">
        <div className="container">
          <nav className="flex items-center gap-1 overflow-x-auto py-2" onMouseLeave={handleMegaMenuLeave}>
            {categories.map(category => {
            const Icon = getCategoryIcon(category.id);
            return <div key={category.id} className="relative" onMouseEnter={() => handleMegaMenuEnter(category.id)}>
                  <Link to={`/categorie/${category.id}`} className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors ${activeMegaMenu === category.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"}`}>
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden xl:inline">{category.name}</span>
                    <span className="xl:hidden">{category.name.split(' ')[0]}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Link>
                </div>;
          })}
          </nav>
        </div>
      </div>

      {/* Mega Menu - Desktop */}
      {activeMegaMenu && activeCategory && <div className="absolute left-0 right-0 top-full z-50 hidden border-b border-border bg-background shadow-lg lg:block" onMouseEnter={() => handleMegaMenuEnter(activeMegaMenu)} onMouseLeave={handleMegaMenuLeave}>
          <div className="container py-6">
            <div className="mb-4 flex items-center gap-2">
              {(() => {
            const Icon = getCategoryIcon(activeCategory.id);
            return <Icon className="h-5 w-5 text-primary" />;
          })()}
              <h3 className="font-heading text-lg font-semibold text-foreground">
                {activeCategory.name}
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-4 xl:grid-cols-6">
              {activeCategory.subcategories.map(sub => <Link key={sub.id} to={`/subcategorie/${sub.id}`} className="group rounded-lg p-3 transition-colors hover:bg-primary/5">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary">
                    {sub.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {sub.description}
                  </p>
                </Link>)}
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <Link to={`/categorie/${activeCategory.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Vezi toate din {activeCategory.name}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>}

      {/* Mobile Menu */}
      {isMobileMenuOpen && <div className="absolute left-0 right-0 top-full max-h-[80vh] overflow-y-auto border-b border-border bg-background shadow-lg lg:hidden">
          <div className="container py-4">
            <div className="mb-4 flex flex-col gap-2">
              <Link to="/cauta" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                <Search className="h-4 w-4" />
                Caută
              </Link>
              <Link to="/adauga-anunt" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                <Plus className="h-4 w-4" />
                Adaugă Anunț
              </Link>
            </div>
            
            <div className="border-t border-border pt-4">
              <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
                Categorii
              </p>
              <div className="flex flex-col">
                {categories.map(category => {
              const Icon = getCategoryIcon(category.id);
              const isExpanded = expandedMobileCategory === category.id;
              return <div key={category.id} className="border-b border-border/50 last:border-b-0">
                      <button onClick={() => toggleMobileCategory(category.id)} className={`flex w-full items-center justify-between gap-2 px-3 py-3 text-left text-sm font-medium transition-colors ${isExpanded ? "bg-primary/10 text-primary" : "text-foreground hover:bg-primary/5"}`}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {category.name}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                      
                      {isExpanded && <div className="bg-muted/30 px-3 py-2">
                          <div className="grid grid-cols-2 gap-2">
                            {category.subcategories.map(sub => <Link key={sub.id} to={`/subcategorie/${sub.id}`} className="rounded-md p-2 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                                {sub.name}
                              </Link>)}
                          </div>
                          <Link to={`/categorie/${category.id}`} className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline" onClick={() => setIsMobileMenuOpen(false)}>
                            Vezi toate
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>}
                    </div>;
            })}
              </div>
            </div>
          </div>
        </div>}
    </header>;
};
export default Navbar;