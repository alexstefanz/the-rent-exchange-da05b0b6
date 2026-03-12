

## Pagina "Cum Funcționează" - versiune detaliată

Pagina actuală are doar 3 carduri simple. O vom transforma într-o pagină completă care explică procesul de închiriere pas cu pas, atât pentru chiriași cât și pentru proprietari.

### Structură nouă a paginii

1. **Hero section** - titlu, subtitlu, breadcrumb
2. **Secțiunea "Pentru Chiriași"** - 4 pași detaliați cu iconuri și descrieri (Caută → Rezervă → Ridică → Returnează)
3. **Secțiunea "Pentru Proprietari"** - 4 pași (Listează → Primește cereri → Predă → Câștigă)
4. **Secțiunea "De ce Rentli?"** - grid cu beneficii (plăți protejate, verificare identitate, asigurare, suport dedicat, anulare gratuită, fără comision la listare)
5. **FAQ Accordion** - 6-8 întrebări frecvente despre proces (Cum funcționează plata? Ce se întâmplă dacă produsul e deteriorat? etc.)
6. **CTA final** - banner cu buton "Începe acum" / "Listează gratuit"
7. **Trust badges** - reutilizare componentă existentă `TrustBadges`

### Implementare

**Fișiere modificate:**
- `src/pages/HowItWorks.tsx` - rescris complet cu toate secțiunile
- `src/data/uxCopy.ts` - adăugare secțiune `howItWorksPage` cu toate textele bilingve (ro/en)

**Componente reutilizate:** Navbar, Footer, TrustBadges, Accordion, Card, Button

**Stil:** Consistent cu AboutUs și restul platformei - rounded-2xl, bg-primary/10 pe iconuri, shadow-card, grid responsive.

