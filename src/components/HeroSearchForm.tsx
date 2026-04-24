import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Drawer, DrawerContent, DrawerTrigger, DrawerTitle,
} from "@/components/ui/drawer";
import { judete } from "@/data/romaniaLocations";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

const HeroSearchForm = () => {
  const navigate = useNavigate();
  const copy = useUxCopy();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJudet, setSelectedJudet] = useState("");
  const [selectedLocalitate, setSelectedLocalitate] = useState("");
  const [judetDrawerOpen, setJudetDrawerOpen] = useState(false);
  const [localitateDrawerOpen, setLocalitateDrawerOpen] = useState(false);

  const selectedJudetData = judete.find((j) => j.name === selectedJudet);
  const localitati = selectedJudetData?.localitati || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedJudet && selectedJudet !== "all") params.set("judet", selectedJudet);
    if (selectedLocalitate && selectedLocalitate !== "all") params.set("localitate", selectedLocalitate);
    navigate(`/cauta?${params.toString()}`);
  };

  const judetDisplayValue = selectedJudet && selectedJudet !== "all"
    ? selectedJudet
    : t("Toată țara", "Entire country");

  const localitateDisplayValue = selectedLocalitate && selectedLocalitate !== "all"
    ? selectedLocalitate
    : t("Selectează localitatea", "Select city");

  return (
    <form
      onSubmit={handleSearch}
      className="flex flex-col gap-4 rounded-xl bg-card p-6 shadow-lg md:flex-row md:items-center md:gap-0 md:rounded-full md:p-2 px-[10px]"
    >
      <div className="flex flex-1 items-center gap-3 px-4 py-4 md:py-0">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder={copy.search.placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 bg-transparent p-0 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 md:text-sm"
        />
      </div>

      <div className="hidden h-8 w-px bg-border md:block" />

      {/* Județ selector */}
      <div className="flex flex-1 items-center gap-3 px-4 py-4 md:py-0">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        {isMobile ? (
          <Drawer open={judetDrawerOpen} onOpenChange={setJudetDrawerOpen}>
            <DrawerTrigger className="flex w-full items-center justify-between text-left">
              <span className={`text-base ${selectedJudet && selectedJudet !== "all" ? "text-foreground" : "text-muted-foreground"}`}>
                {judetDisplayValue}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </DrawerTrigger>
            <DrawerContent>
              <DrawerTitle className="sr-only">{t("Selectează județul", "Select county")}</DrawerTitle>
              <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-2" style={{ WebkitOverflowScrolling: "touch" }}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-base text-foreground active:bg-accent"
                  onClick={() => { setSelectedJudet("all"); setSelectedLocalitate(""); setJudetDrawerOpen(false); }}
                >
                  {t("Toată țara", "Entire country")}
                  {(!selectedJudet || selectedJudet === "all") && <Check className="h-5 w-5 text-primary" />}
                </button>
                {judete.map((judet) => (
                  <button
                    type="button"
                    key={judet.name}
                    className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-base text-foreground active:bg-accent"
                    onClick={() => { setSelectedJudet(judet.name); setSelectedLocalitate(""); setJudetDrawerOpen(false); }}
                  >
                    {judet.name}
                    {selectedJudet === judet.name && <Check className="h-5 w-5 text-primary" />}
                  </button>
                ))}
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
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
        )}
      </div>

      {/* Localitate selector */}
      {selectedJudet && selectedJudet !== "all" && (
        <>
          <div className="hidden h-8 w-px bg-border md:block" />
          <div className="flex flex-1 items-center gap-2 px-4 py-4 md:py-0">
            {isMobile ? (
              <Drawer open={localitateDrawerOpen} onOpenChange={setLocalitateDrawerOpen}>
                <DrawerTrigger className="flex w-full items-center justify-between text-left">
                  <span className={`text-base ${selectedLocalitate && selectedLocalitate !== "all" ? "text-foreground" : "text-muted-foreground"}`}>
                    {localitateDisplayValue}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerTitle className="sr-only">{t("Selectează localitatea", "Select city")}</DrawerTitle>
                  <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-2" style={{ WebkitOverflowScrolling: "touch" }}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-base text-foreground active:bg-accent"
                      onClick={() => { setSelectedLocalitate("all"); setLocalitateDrawerOpen(false); }}
                    >
                      {t("Toate localitățile", "All cities")}
                      {(!selectedLocalitate || selectedLocalitate === "all") && <Check className="h-5 w-5 text-primary" />}
                    </button>
                    {localitati.map((loc) => (
                      <button
                        type="button"
                        key={loc}
                        className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-base text-foreground active:bg-accent"
                        onClick={() => { setSelectedLocalitate(loc); setLocalitateDrawerOpen(false); }}
                      >
                        {loc}
                        {selectedLocalitate === loc && <Check className="h-5 w-5 text-primary" />}
                      </button>
                    ))}
                  </div>
                </DrawerContent>
              </Drawer>
            ) : (
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
            )}
          </div>
        </>
      )}

      <Button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-5 text-base text-primary-foreground hover:bg-primary/90 md:w-auto md:py-3 md:text-sm">
        {t("Caută", "Search")}
      </Button>
    </form>
  );
};

export default HeroSearchForm;
