import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, ChevronDown, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { judete } from "@/data/romaniaLocations";
import { categories } from "@/data/categories";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSearchForm = () => {
  const navigate = useNavigate();
  const copy = useUxCopy();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedJudet, setSelectedJudet] = useState("");
  const [selectedLocalitate, setSelectedLocalitate] = useState("");

  const selectedJudetData = judete.find((j) => j.name === selectedJudet);
  const localitati = selectedJudetData?.localitati || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory && selectedCategory !== "all") params.set("categorie", selectedCategory);
    if (selectedJudet && selectedJudet !== "all") params.set("judet", selectedJudet);
    if (selectedLocalitate && selectedLocalitate !== "all") params.set("localitate", selectedLocalitate);
    navigate(`/cauta?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="flex flex-col gap-2 rounded-xl bg-card p-4 shadow-lg md:flex-row md:items-center md:gap-0 md:rounded-full md:p-2"
    >
      <div className="flex flex-1 items-center gap-3 px-4 py-2 md:py-0">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t("Caută obiecte...", "Search items...")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 bg-transparent p-0 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 md:text-sm"
        />
      </div>

      <div className="hidden h-8 w-px bg-border md:block" />

      <div className="flex flex-1 items-center gap-3 px-4 py-2 md:py-0">
        <Grid3X3 className="h-5 w-5 text-muted-foreground" />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full border-0 bg-transparent p-0 text-foreground shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
            <div className="flex items-center justify-between w-full">
              <SelectValue placeholder={copy.search_page.allCategoriesFilter} />
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-[300px] bg-card z-50">
            <SelectItem value="all">{copy.search_page.allCategoriesFilter}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="hidden h-8 w-px bg-border md:block" />

      <div className="flex flex-1 items-center gap-3 px-4 py-2 md:py-0">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        <Select value={selectedJudet} onValueChange={(value) => { setSelectedJudet(value); setSelectedLocalitate(""); }}>
          <SelectTrigger className="w-full border-0 bg-transparent p-0 text-foreground shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
            <div className="flex items-center justify-between w-full">
              <SelectValue placeholder={t("Toată țara", "Entire country")} />
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-[300px] bg-card z-50">
            <SelectItem value="all">{t("Toată țara", "Entire country")}</SelectItem>
            {judete.map((judet) => (
              <SelectItem key={judet.name} value={judet.name}>{judet.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedJudet && selectedJudet !== "all" && (
        <>
          <div className="hidden h-8 w-px bg-border md:block" />
          <div className="flex flex-1 items-center gap-2 px-4">
            <Select value={selectedLocalitate} onValueChange={setSelectedLocalitate}>
              <SelectTrigger className="w-full border-0 bg-transparent p-0 text-foreground shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                <div className="flex items-center justify-between w-full">
                  <SelectValue placeholder={t("Selectează localitatea", "Select city")} />
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-[300px] bg-card z-50">
                <SelectItem value="all">{t("Toate localitățile", "All cities")}</SelectItem>
                {localitati.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <Button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 md:w-auto">
        {t("Caută", "Search")}
      </Button>
    </form>
  );
};

export default HeroSearchForm;
