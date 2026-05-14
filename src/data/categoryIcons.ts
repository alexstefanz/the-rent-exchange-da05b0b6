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
  Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ExcavatorIcon from "@/components/icons/ExcavatorIcon";

type CategoryIconComponent = LucideIcon | typeof ExcavatorIcon;

export const categoryIcons: Record<number, CategoryIconComponent> = {
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
  11: ExcavatorIcon, // Utilaje (custom Excavator)
  12: Package,      // Diverse
};

export const getCategoryIcon = (categoryId: number): CategoryIconComponent => {
  return categoryIcons[categoryId] || Package;
};
