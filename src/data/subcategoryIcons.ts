import {
  Bike,
  Mountain,
  Zap,
  Car,
  CircleDot,
  Battery,
  Footprints,
  Sailboat,
  Ship,
  Waves,
  Anchor,
  Fish,
  Tent,
  BedDouble,
  Armchair,
  Backpack,
  Flame,
  TreePine,
  Flashlight,
  Footprints as BootIcon,
  Snowflake,
  MountainSnow,
  Hammer,
  Wrench,
  Leaf,
  CircleGauge,
  Wind,
  Factory,
  ArrowUpFromLine,
  Droplets,
  Sprout,
  Castle,
  Droplet,
  Layers,
  Gamepad2,
  Joystick,
  MonitorPlay,
  Disc3,
  Glasses,
  Laptop,
  Projector,
  Speaker,
  Plane,
  Camera,
  Video,
  Focus,
  Sun,
  Triangle,
  Mic,
  Smartphone,
  CircleDashed as UniIcon,
  PartyPopper,
  Power,
  CloudFog,
  CircleDashed,
  Music,
  Beef,
  Lamp,
  Popcorn,
  Candy,
  Sliders,
  Guitar,
  MicVocal,
  Piano,
  Dumbbell,
  Gauge,
  Weight,
  Activity,
  Sparkles,
  Heart,
  Accessibility,
  PersonStanding,
  Bed,
  Stethoscope,
  Syringe,
  PawPrint,
  Dog,
  Home,
  Scissors,
  Truck,
  Container,
  Package,
  Baby,
  Sofa,
  ShoppingBag,
  Printer,
  Cpu,
  Telescope,
  Binoculars,
  Gem,
  Flower2,
  Shirt,
  Drama,
  SprayCan,
  AirVent,
  Caravan,
  type LucideIcon,
} from "lucide-react";

// Map subcategory IDs to their icons
export const subcategoryIcons: Record<string, LucideIcon> = {
  // OUTDOOR & AVENTURĂ (1-x)
  "1-1": Bike,           // Biciclete
  "1-2": Mountain,       // MTB / Downhill
  "1-3": Zap,            // Trotinete electrice
  "1-4": Car,            // ATV-uri
  "1-5": CircleDot,      // Scutere
  "1-6": Battery,        // E-bike
  "1-7": Footprints,     // Role / patine
  "1-8": Sailboat,       // Caiace
  "1-9": Ship,           // Canoe
  "1-10": Waves,         // SUP boards
  "1-11": Anchor,        // Bărci / ambarcațiuni mici
  "1-12": Fish,          // Echipament pescuit

  // CAMPING & DRUMEȚII (2-x)
  "2-1": Tent,           // Corturi 1–8 persoane
  "2-2": Tent,           // Corturi mari evenimente
  "2-3": BedDouble,      // Saltele + saci de dormit
  "2-4": Armchair,       // Mese + scaune camping
  "2-5": Backpack,       // Rucsacuri trekking
  "2-6": Flame,          // Arzătoare & seturi gătit
  "2-7": TreePine,       // Hamace
  "2-8": Flashlight,     // Lanterne / frontale
  "2-9": BootIcon,       // Bocanci / rachete zăpadă

  // SPORTURI DE IARNĂ (3-x)
  "3-1": Snowflake,      // Sănii
  "3-2": MountainSnow,   // Schiuri
  "3-3": Mountain,       // Snowboard
  "3-4": BootIcon,       // Boots
  "3-5": Glasses,        // Căști & protecții
  "3-6": MountainSnow,   // Set complet schi

  // SCULE, UNELTE & CONSTRUCȚII (4-x)
  "4-1": Hammer,         // Scule electrice
  "4-2": Wrench,         // Echipamente profesionale
  "4-3": Leaf,           // Scule grădină
  "4-4": CircleGauge,    // Unelte auto
  "4-5": Wind,           // Aspiratoare
  "4-6": Factory,        // Betoniere electrice
  "4-7": Factory,        // Plăci compactoare
  "4-8": Container,      // Lift panouri
  "4-9": ArrowUpFromLine, // Scări 5–12 m
  "4-10": Hammer,        // Ciocan demolator
  "4-11": Power,         // Generator mare
  "4-12": Droplets,      // Pompe de apă
  "4-13": Sprout,        // Sisteme irigații
  "4-14": Droplet,       // Aspersoare profesionale

  // JUCĂRII GONFLABILE & COPII (5-x)
  "5-1": Castle,         // Castele gonflabile
  "5-2": Droplet,        // Piscine gonflabile
  "5-3": Layers,         // Tobogane gonflabile
  "5-4": Castle,         // Mini-parcuri gonflabile
  "5-5": Car,            // Mașinuțe electrice
  "5-6": Bike,           // Triciclete / trotinete copii
  "5-7": PartyPopper,    // Seturi petreceri

  // GAMING & ELECTRONICE (6-x)
  "6-1": Gamepad2,       // Console PlayStation
  "6-2": Joystick,       // Xbox
  "6-3": MonitorPlay,    // Nintendo Switch / Wii
  "6-4": Disc3,          // Jocuri console
  "6-5": Glasses,        // VR headset
  "6-6": Laptop,         // Laptopuri gaming
  "6-7": Projector,      // Proiectoare
  "6-8": Speaker,        // Boxe portabile

  // FOTO & VIDEO (7-x)
  "7-1": Plane,          // Dronă
  "7-2": Camera,         // GoPro
  "7-3": Video,          // Gimbal
  "7-4": Camera,         // DSLR / Mirrorless
  "7-5": Sun,            // Lumini studio
  "7-6": Triangle,       // Trepiede
  "7-7": Mic,            // Kit vlogging

  // MOBILITATE URBANĂ (8-x)
  "8-1": Zap,            // Trotinete electrice
  "8-2": Battery,        // Biciclete electrice
  "8-3": CircleDot,      // Scutere / mopede
  "8-4": UniIcon,        // Monocicluri electrice

  // EVENIMENTE & HOBBY (9-x)
  "9-1": Tent,           // Corturi mari
  "9-2": Power,          // Generatoare
  "9-3": CloudFog,       // Mașini fum
  "9-4": CircleDashed,   // Mașini bubble
  "9-5": Snowflake,      // Mașini gheață
  "9-6": Music,          // Sonorizare
  "9-7": Beef,           // Grătare
  "9-8": Beef,           // Grătare profesionale
  "9-9": Lamp,           // Lămpi decorative
  "9-10": Popcorn,       // Aparat popcorn
  "9-11": Candy,         // Aparat vată de zahăr

  // INSTRUMENTE MUZICALE & DJ (10-x)
  "10-1": Sliders,       // Mixere DJ
  "10-2": Speaker,       // Boxe profesionale
  "10-3": MicVocal,      // Microfoane
  "10-4": Mic,           // Karaoke set
  "10-5": Guitar,        // Chitare
  "10-6": Piano,         // Tastaturi
  "10-7": Speaker,       // Amplificatoare
  "10-8": Sliders,       // Seturi DJ

  // FITNESS & WELLNESS (11-x)
  "11-1": Gauge,         // Benzi alergare
  "11-2": Bike,          // Biciclete indoor
  "11-3": Weight,        // Greutăți
  "11-4": Activity,      // Stepper
  "11-5": Dumbbell,      // Trambuline
  "11-6": Sparkles,      // Aparate masaj
  "11-7": Heart,         // Presoterapie
  "11-8": Sparkles,      // Kit yoga

  // ECHIPAMENTE MEDICALE & RECUPERARE (12-x)
  "12-1": Accessibility, // Cărucioare
  "12-2": Activity,      // Cârje
  "12-3": Activity,      // Cadre mers
  "12-4": Bed,           // Paturi medicale
  "12-5": Stethoscope,   // Monitoare semne vitale
  "12-6": Syringe,       // Aparatură oxigen
  "12-7": Heart,         // Nebulizatoare

  // ANIMALE DE COMPANIE & ACCESORII (13-x)
  "13-1": PawPrint,      // Cărucioare animale
  "13-2": Home,          // Țarcuri / cuști transport
  "13-3": Dog,           // Lese / hamuri
  "13-4": Scissors,      // Toaletaj portabil

  // REMORCI & TRANSPORT (14-x)
  "14-1": Truck,         // Remorci auto
  "14-2": Bike,          // Remorci biciclete
  "14-3": Container,     // Portbagaje
  "14-4": Package,       // Boxe transfer

  // BEBE & FAMILY RENTALS (15-x)
  "15-1": Baby,          // Cărucioare bebe
  "15-2": Baby,          // Scaune auto copii
  "15-3": BedDouble,     // Pătuțuri pliant
  "15-4": Sofa,          // Scaune înălțătoare
  "15-5": Backpack,      // Rucsac port-bebe
  "15-6": ShoppingBag,   // Baby monitor

  // IMPRIMANTE 3D & CNC (16-x)
  "16-1": Printer,       // Imprimante 3D
  "16-2": Cpu,           // CNC portabil

  // TELESCOP & OBSERVAȚIE (17-x)
  "17-1": Telescope,     // Telescoape
  "17-2": Binoculars,    // Binocluri

  // NUNȚI & EVENIMENTE PREMIUM (19-x)
  "19-1": Gem,           // Decoruri nuntă
  "19-2": Flower2,       // Aranjamente florale

  // COSTUME & RECIZITĂ (20-x)
  "20-1": Shirt,         // Costume
  "20-2": Drama,         // Măști & recuzită

  // INDUSTRIAL CLEANING (21-x)
  "21-1": SprayCan,      // Echipamente curățenie
  "21-2": AirVent,       // Aspiratoare industriale

  // RULOTE & CAMPERVAN-URI (22-x)
  "22-1": Caravan,       // Rulote
  "22-2": Caravan,       // Campervan-uri
};

export const getSubcategoryIcon = (subcategoryId: string): LucideIcon => {
  return subcategoryIcons[subcategoryId] || Mountain;
};
