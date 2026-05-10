import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  categoryName: string;
  value: string;
  onChange: (v: string) => void;
}

const CategorySearchBar = ({ categoryName, value, onChange }: Props) => {
  const { t } = useLanguage();
  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t(`Caută în ${categoryName}…`, `Search in ${categoryName}…`)}
        className="h-12 pl-11 pr-10 rounded-full bg-card border-border/60 text-base focus-visible:ring-primary/30 focus-visible:ring-2 focus-visible:ring-offset-0 shadow-sm"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:bg-muted"
          aria-label={t("Șterge", "Clear")}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default CategorySearchBar;
