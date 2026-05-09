import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  onNavigate: () => void;
}

export function DrawerSearch({ onNavigate }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    navigate(`/cauta?q=${encodeURIComponent(term)}`);
    onNavigate();
  };

  return (
    <form onSubmit={submit} className="px-2">
      <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 transition-colors focus-within:border-primary/50 focus-within:bg-background">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("Caută orice...", "Search anything...")}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>
    </form>
  );
}