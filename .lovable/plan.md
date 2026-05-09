## Eliminare banner portocaliu din "Detalii cont"

În cardul hero din `src/components/profile/AccountTab.tsx` există un banner gradient portocaliu (h-32) plasat deasupra avatarului, care nu transmite informație utilă.

### Modificări

**`src/components/profile/AccountTab.tsx`** — secțiunea HERO CARD:
- Elimin `<div className="h-32 bg-gradient-to-br from-[#F59E0B] ...">` și cele două blur-uri decorative.
- Elimin `-mt-14` (compensa overlap-ul peste banner) → conținutul revine la padding normal `pt-6`.
- Inelul gradient din jurul avatarului rămâne (este elementul care păstrează accentul de brand).
- Restul: nume, badge "Verificat", email, "Membru din", trust ring și stats — neschimbate.

### Rezultat
Card curat cu fundal alb, avatar cu inel portocaliu subtil, identitate și statistici clare — fără bandă decorativă inutilă.
