## Scop

Actualizez secțiunea bento "De ce ne aleg utilizatorii" (folosită atât pe Homepage cât și pe pagina "Cum funcționează" prin componenta partajată `WhyChooseUsBento`) cu noul conținut și mici ajustări vizuale din imaginea atașată.

## Modificări

### 1. `src/components/home/WhyChooseUsBento.tsx`

**Cardul mare (Plată securizată)**
- Pill verde înlocuit cu pill `• PLATĂ SECURIZATĂ` (text nou, păstrăm stilul verde existent).
- Titlul devine `Sistem de plăți` + accent portocaliu `protejat integral.`
- Descrierea din interiorul cardului de tranzacție: label `Sumă tranzacție` (în loc de `Sumă în custodie`).
- Badge-ul cardului tranzacție rămâne `SECURIZAT`.
- Etichetele celor 3 stadii devin: `Inițiată` / `În procesare` / `Confirmată`.
- Descrierea de sub card devine: „Procesare securizată prin parteneri certificați. Plata este confirmată doar după ce produsul este predat conform PV-ului semnat digital de ambele părți."
- Elimin rândul de tag-uri PSD2 / 3DS2 / PCI-DSS / GDPR (nu mai apare în noul design).

**Cele 4 carduri mici** — fiecare card primește:
- În colțul dreapta sus, un indicator vizual specific (înlocuiește numărul de statistică):
  - Identitate verificată → badge verde `• VERIFICAT` cu 3 puncte (2 portocalii + 1 gri).
  - Asigurare inclusă → pill portocaliu deschis `PROTEJAT`.
  - Suport 24/7 → mini-iconiță "audio bars" (4 bare portocalii).
  - Fără comision la listare → text mic `0%` peste eticheta `COMISION`, cu dot verde.
- Sub descriere, un rând de chip-uri (pill-uri cu border, dot portocaliu + text):
  - Identitate verificată: `CI verificat`, `Selfie match`, `Telefon`.
  - Asigurare inclusă: `Daune accidentale`, `Furt`, `Asistență`.
  - Suport 24/7: `Chat`, `Email`, `Telefon`.
  - Fără comision la listare: `0 lei listare`, `Anulare gratuită`, `Plată sigură`.
- Titlurile actualizate: `Identitate verificată`, `Asigurare inclusă`, `Suport 24/7`, `Fără comision la listare`.
- Descrierile actualizate exact ca în imagine:
  - „KYC complet pentru toți utilizatorii."
  - „Acoperire de bază la fiecare rezervare."
  - „Echipă reală, disponibilă oricând ai nevoie."
  - „Plătești doar când închiriezi cu succes."

### 2. `src/data/uxCopy.ts`

Actualizez câmpurile bilingve existente și adaug cheile noi pentru chip-uri și pentru noul indicator vizual (`bento*Chip1/2/3`, label-uri pentru badge-urile din colț). Variantele EN păstrează aceeași structură.

## Ce NU se modifică

- Pagina `HowItWorks.tsx` rămâne neschimbată — folosește deja `WhyChooseUsBento`, deci primește automat noul design.
- Layout-ul general (grid bento, dimensiuni, gradient card mare, fonturi) rămâne identic.
- Nu se modifică logică sau backend.
