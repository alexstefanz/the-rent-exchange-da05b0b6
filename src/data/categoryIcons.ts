import {
  Wrench,
  PartyPopper,
  Monitor,
  Flower2,
  TreePine,
  Castle,
  Dumbbell,
  Luggage,
  Truck,
  Shirt,
  Construction,
  Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const categoryIcons: Record<number, LucideIcon> = {
  1: Wrench,        // Unelte
  2: PartyPopper,   // Evenimente
  3: Monitor,       // Electronice
  4: Flower2,       // Grădinărit
  5: TreePine,      // Outdoor
  6: Castle,        // Jucării și Petrecere Copii
  7: Dumbbell,      // Sport
  8: Luggage,       // Travel
  9: Truck,         // Transport și Utilitare
  10: Shirt,        // Haine și Recuzită
  11: Construction, // Utilaje (Excavator/Construction)
  12: Package,      // Diverse
};

export const getCategoryIcon = (categoryId: number): LucideIcon => {
  return categoryIcons[categoryId] || Package;
};
