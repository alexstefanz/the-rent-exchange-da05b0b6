import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, ChevronDown, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { judete } from "@/data/romaniaLocations";
import { categories } from "@/data/categories";

const HeroSearchForm = () => {
  const navigate = useNavigate();
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
      className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-lg md:flex-row md:items-center md:gap-0 md:rounded-full md:p-2"
    >
      {/* Search input */}
      <div className="flex flex-1 items-center gap-2 px-4">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Ce anume căutați?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 bg-transparent p-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* Divider */}
      <div className="hidden h-8 w-px bg-border md:block" />

      {/* Category select */}
      <div className="flex flex-1 items-center gap-2 px-4">
        <Grid3X3 className="h-5 w-5 text-muted-foreground" />
        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="w-full border-0 bg-transparent p-0 text-foreground shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
            <div className="flex items-center justify-between w-full">
              <SelectValue placeholder="Toate categoriile" />
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-[300px] bg-card z-50">
            <SelectItem value="all">Toate categoriile</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Divider */}
      <div className="hidden h-8 w-px bg-border md:block" />

      {/* Location selects */}
      <div className="flex flex-1 items-center gap-2 px-4">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        <Select
          value={selectedJudet}
          onValueChange={(value) => {
            setSelectedJudet(value);
            setSelectedLocalitate("");
          }}
        >
          <SelectTrigger className="w-full border-0 bg-transparent p-0 text-foreground shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
            <div className="flex items-center justify-between w-full">
              <SelectValue placeholder="Toată țara" />
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-[300px] bg-card z-50">
            <SelectItem value="all">Toată țara</SelectItem>
            {judete.map((judet) => (
              <SelectItem key={judet.name} value={judet.name}>
                {judet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Localitate select - shows when judet is selected */}
      {selectedJudet && selectedJudet !== "all" && (
        <>
          <div className="hidden h-8 w-px bg-border md:block" />
          <div className="flex flex-1 items-center gap-2 px-4">
            <Select
              value={selectedLocalitate}
              onValueChange={setSelectedLocalitate}
            >
              <SelectTrigger className="w-full border-0 bg-transparent p-0 text-foreground shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                <div className="flex items-center justify-between w-full">
                  <SelectValue placeholder="Selectează localitatea" />
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-[300px] bg-card z-50">
                <SelectItem value="all">Toate localitățile</SelectItem>
                {localitati.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Search button */}
      <Button
        type="submit"
        className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default HeroSearchForm;
