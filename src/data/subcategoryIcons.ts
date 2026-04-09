import {
  Wrench,
  Hammer,
  HardHat,
  Ruler,
  SprayCan,
  Armchair,
  Sparkles,
  Speaker,
  Tent,
  UtensilsCrossed,
  CloudFog,
  Smartphone,
  Laptop,
  Projector,
  Headphones,
  Gamepad2,
  Camera,
  Tablet,
  Flower2,
  TreePine,
  Droplets,
  Cog,
  Flame,
  Footprints,
  Mountain,
  Castle,
  Puzzle,
  Shirt as ShirtIcon,
  PartyPopper,
  Dumbbell,
  Users,
  Bike,
  Snowflake,
  Waves,
  Heart,
  Luggage,
  Backpack,
  Plug,
  PawPrint,
  Truck,
  Car,
  CircleDot,
  Zap,
  Package,
  Container,
  Shirt,
  Drama,
  Ghost,
  Tractor,
  Shovel,
  Sprout,
  CloudRain,
  Wheat,
  Settings,
  type LucideIcon,
} from "lucide-react";

export const subcategoryIcons: Record<string, LucideIcon> = {
  // Unelte (1-x)
  "1-1": Hammer,         // Scule electrice
  "1-2": Wrench,         // Scule manuale
  "1-3": HardHat,        // Construcții
  "1-4": Ruler,          // Măsurare și nivelare
  "1-5": SprayCan,       // Curățenie industrială

  // Evenimente (2-x)
  "2-1": Armchair,       // Mobilier evenimente
  "2-2": Sparkles,       // Decor și lighting
  "2-3": Speaker,        // Echipamente audio-video
  "2-4": Tent,           // Corturi și pavilioane
  "2-5": UtensilsCrossed, // Catering și servire
  "2-6": CloudFog,       // Echipamente speciale

  // Electronice (3-x)
  "3-1": Smartphone,     // Electrocasnice mici
  "3-2": Laptop,         // Laptopuri și PC
  "3-3": Projector,      // TV și proiectoare
  "3-4": Headphones,     // Audio
  "3-5": Gamepad2,       // Gaming
  "3-6": Camera,         // Foto și video
  "3-7": Tablet,         // Tablete

  // Grădinărit (4-x)
  "4-1": Flower2,        // Unelte grădină
  "4-2": TreePine,       // Mașini de tuns gazon
  "4-3": Droplets,       // Sisteme de irigații
  "4-4": Cog,            // Motounelte

  // Outdoor (5-x)
  "5-1": Tent,           // Camping
  "5-2": Footprints,     // Echipament Drumeții
  "5-3": Flame,          // Grătare
  "5-4": Mountain,       // Echipamente de aventură

  // Jucării și Petrecere Copii (6-x)
  "6-1": Castle,         // Tobogane și gonflabile
  "6-2": Puzzle,         // Jocuri interactive
  "6-3": ShirtIcon,      // Costume copii
  "6-4": PartyPopper,    // Decor

  // Sport (7-x)
  "7-1": Dumbbell,       // Fitness
  "7-2": Users,          // Sporturi de echipă
  "7-3": Bike,           // Biciclete și accesorii
  "7-4": Snowflake,      // Sporturi de iarnă
  "7-5": Waves,          // Sporturi de apă
  "7-6": Heart,          // Recuperare și wellness

  // Travel (8-x)
  "8-1": Luggage,        // Valize și trolere
  "8-2": Backpack,       // Rucsaci travel
  "8-3": Plug,           // Accesorii călătorie
  "8-4": PawPrint,       // Cuști și transport animale

  // Transport și Utilitare (9-x)
  "9-1": Truck,          // Remorci
  "9-2": Car,            // Platforme auto
  "9-3": CircleDot,      // ATV și off-road
  "9-4": CircleDot,      // Motociclete și scutere
  "9-5": Package,        // Transport marfă
  "9-6": Container,      // Echipamente transport
  "9-7": Zap,            // Trotinete

  // Haine și Recuzită (10-x)
  "10-1": Shirt,         // Costume tematice
  "10-2": Shirt,         // Ținute elegante
  "10-3": Ghost,         // Costume Halloween

  // Echipamente Agricole (11-x)
  "11-1": Tractor,       // Tractoare și mini-tractoare
  "11-2": Shovel,        // Utilaje de prelucrare sol
  "11-3": Sprout,        // Semănat și plantat
  "11-4": CloudRain,     // Irigare agricolă
  "11-5": Wheat,         // Recoltare
  "11-6": Settings,      // Atașamente și accesorii
};

export const getSubcategoryIcon = (subcategoryId: string): LucideIcon => {
  return subcategoryIcons[subcategoryId] || Package;
};
