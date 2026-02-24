import { useState, useMemo } from "react";
import { icons, LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LucideIconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

const POPULAR_ICONS = [
  "Mountain", "Tent", "Snowflake", "Wrench", "Castle", "Gamepad2", "Camera",
  "Zap", "PartyPopper", "Music", "Dumbbell", "Heart", "PawPrint", "Truck",
  "Baby", "Printer", "Telescope", "Gem", "Drama", "SprayCan", "Caravan",
  "Bike", "Car", "Plane", "Ship", "Home", "Building", "Trees", "Sun",
  "Umbrella", "Shirt", "Watch", "Laptop", "Smartphone", "Headphones",
  "Paintbrush", "Hammer", "Scissors", "BookOpen", "GraduationCap",
  "Stethoscope", "Leaf", "Flame", "Waves", "Wind", "CloudSun",
];

const LucideIconPicker = ({ value, onChange }: LucideIconPickerProps) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filteredIcons = useMemo(() => {
    const allIconNames = Object.keys(icons);
    if (!search.trim()) {
      return POPULAR_ICONS.filter(name => allIconNames.includes(name));
    }
    return allIconNames
      .filter(name => name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 60);
  }, [search]);

  const SelectedIcon = value && icons[value as keyof typeof icons] 
    ? icons[value as keyof typeof icons] 
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2 h-10">
          {SelectedIcon ? (
            <>
              <SelectedIcon className="h-4 w-4" />
              <span className="text-sm">{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">Alege un icon...</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <Input
          placeholder="Caută icon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <ScrollArea className="h-[240px]">
          <div className="grid grid-cols-6 gap-1">
            {filteredIcons.map((name) => {
              const Icon = icons[name as keyof typeof icons] as LucideIcon;
              if (!Icon) return null;
              return (
                <Button
                  key={name}
                  variant={value === name ? "default" : "ghost"}
                  size="icon"
                  className="h-9 w-9"
                  title={name}
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>
          {filteredIcons.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              Niciun icon găsit
            </p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default LucideIconPicker;
