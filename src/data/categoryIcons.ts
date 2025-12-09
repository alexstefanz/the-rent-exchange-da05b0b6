import {
  Mountain,
  Tent,
  Snowflake,
  Wrench,
  Castle,
  Gamepad2,
  Camera,
  Zap,
  PartyPopper,
  Music,
  Dumbbell,
  Heart,
  PawPrint,
  Truck,
  Baby,
  Printer,
  Telescope,
  Gem,
  Drama,
  SprayCan,
  Caravan,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const categoryIcons: Record<number, LucideIcon> = {
  1: Mountain,      // OUTDOOR & AVENTURĂ
  2: Tent,          // CAMPING & DRUMEȚII
  3: Snowflake,     // SPORTURI DE IARNĂ
  4: Wrench,        // SCULE, UNELTE & CONSTRUCȚII
  5: Castle,        // JUCĂRII GONFLABILE & COPII
  6: Gamepad2,      // GAMING & ELECTRONICE
  7: Camera,        // FOTO & VIDEO
  8: Zap,           // MOBILITATE URBANĂ
  9: PartyPopper,   // EVENIMENTE & HOBBY
  10: Music,        // INSTRUMENTE MUZICALE & DJ
  11: Dumbbell,     // FITNESS & WELLNESS
  12: Heart,        // ECHIPAMENTE MEDICALE & RECUPERARE
  13: PawPrint,     // ANIMALE DE COMPANIE & ACCESORII
  14: Truck,        // REMORCI & TRANSPORT
  15: Baby,         // BEBE & FAMILY RENTALS
  16: Printer,      // IMPRIMANTE 3D & CNC
  17: Telescope,    // TELESCOP & OBSERVAȚIE
  19: Gem,          // NUNȚI & EVENIMENTE PREMIUM
  20: Drama,        // COSTUME & RECIZITĂ
  21: SprayCan,     // INDUSTRIAL CLEANING
  22: Caravan,      // RULOTE & CAMPERVAN-URI
};

export const getCategoryIcon = (categoryId: number): LucideIcon => {
  return categoryIcons[categoryId] || Mountain;
};
