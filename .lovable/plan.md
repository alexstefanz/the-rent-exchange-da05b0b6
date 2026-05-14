Înlocuiesc iconul custom de excavator cu `Forklift` din lucide-react pentru categoria „Utilaje” (id 11), pentru consistență vizuală cu celelalte iconițe.

## Modificări

**`src/data/categoryIcons.ts`**
- Elimin importul custom `ExcavatorIcon` și tipul `CategoryIconComponent`
- Adaug `Forklift` la importurile din `lucide-react`
- Revin la `Record<number, LucideIcon>`
- Setez `11: Forklift` cu comentariul „Utilaje”

**Cleanup**
- Șterg `src/components/icons/ExcavatorIcon.tsx` (nemaifolosit)
- Șterg `src/assets/icons/excavator.svg` (nemaifolosit)
