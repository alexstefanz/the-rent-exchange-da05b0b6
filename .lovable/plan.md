## Scop

Pe pagina **Cum funcționează**, secțiunea „Cum decurge o închiriere" — adăugăm animații legate de scroll pe timeline-ul zigzag desktop (și o versiune simplificată pe mobil).

## Comportament

1. **Bara verticală (timeline)** — gradient-ul static din `bg-gradient-to-b` se înlocuiește cu o bară de fundal `bg-primary/15` plus o bară de „fill" portocalie (`bg-primary`) a cărei înălțime crește pe măsură ce utilizatorul derulează prin secțiune (0% → 100% pe lungimea timeline-ului).
2. **Carduri (text)** — fiecare card glisează în poziție cu fade-in: cele de pe stânga vin din stânga (`-translate-x-8 → 0`), cele de pe dreapta vin din dreapta (`translate-x-8 → 0`), `opacity 0 → 1`. Trigger când rândul intră în viewport (~60% jos).
3. **Iconițe** — fiecare iconiță are 2 stări:
   - **inactivă**: `bg-card` + border + `text-primary` (actual).
   - **activă**: `bg-primary` + `text-primary-foreground` (alb), fără border, cu un mic „pop" (scale 0.95→1) și ring portocaliu subtil.
   Tranziția spre „activă" se declanșează când fill-ul barei verticale ajunge la nivelul vertical al iconiței respective (centrul cardului depășește progresul de scroll).
4. **Punctele centrale** (dot-urile de pe axă) — devin pline portocaliu când fill-ul le atinge; altfel rămân `primary/30`.
5. **Mobil** — aceeași logică simplificată: bara stângă se umple pe scroll, dot-urile + iconițele cardurilor devin portocalii când fill-ul le atinge, iar cardurile fac fade-in-up.

## Implementare tehnică

Fișier modificat: `src/pages/HowItWorks.tsx` (secțiunea „Cycle" — zigzag desktop + listă mobil).

- Folosim `framer-motion` (deja în dependențe) cu `useScroll({ target: sectionRef, offset: ["start 80%", "end 20%"] })` pentru a obține `scrollYProgress` pe înălțimea timeline-ului.
- Bara de fill: `motion.div` cu `style={{ height: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]) }}`, poziționată peste bara de fundal.
- Pentru fiecare pas, calculăm un prag `threshold = (idx + 0.5) / cycleSteps.length`. Folosim `useTransform(scrollYProgress, [threshold - 0.05, threshold], [0, 1])` → un `MotionValue` per pas; aplicăm pe dot + iconiță (background + culoare icon) prin `useMotionTemplate` sau `animate` condiționat.
- Pentru carduri folosim `whileInView={{ opacity: 1, x: 0 }}` cu `initial={{ opacity: 0, x: left ? -32 : 32 }}` și `viewport={{ once: true, amount: 0.5 }}`.
- Tranzițiile CSS pe iconițe: `transition-colors duration-300` ca fallback estetic.
- `prefers-reduced-motion`: respectăm via `useReducedMotion()` — dezactivăm translate-urile, păstrăm doar fill-ul.

## Ce NU se modifică

- Conținut, copy, structura datelor (`cycleSteps`).
- Restul paginii (`WhyChooseUsBento`, FAQ etc.).
- Tokenii de design (folosim `primary` / `primary-foreground` existenți).
