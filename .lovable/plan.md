## Problem

In meniul mobil (hamburger) din `Navbar.tsx`, secțiunea „Categorii" afișează numele categoriilor și subcategoriilor doar în română, indiferent de limba selectată. Restul navbarului folosește deja `t("RO", "EN")`, dar lista de categorii citește direct `category.name` și `sub.name` din `src/data/categories.ts`, ignorând câmpurile `nameEn` / `subcategory.nameEn` care există deja în date.

## Fix

În `src/components/layout/Navbar.tsx`, la randarea categoriilor mobile (liniile ~518–548):

- Obține limba curentă: `const { t, language } = useLanguage();` (în loc de doar `t`).
- Linia 531 — înlocuiește `{category.name}` cu `{language === "en" ? category.nameEn : category.name}`.
- Linia 546 — înlocuiește `{sub.name}` cu `{language === "en" ? sub.nameEn : sub.name}`.

Nicio modificare pe DB, niciun fișier nou. Datele bilingve sunt deja prezente în `src/data/categories.ts` (`nameEn` pentru fiecare categorie și subcategorie), deci e doar o conectare la contextul de limbă.

## Verificare

- Cu UI pe RO: „Unelte", „Evenimente", „Scule electrice" etc.
- Cu UI pe EN: „Tools", „Events", „Power Tools" etc.
- Restul meniului mobil (KYC Verification, Support & Tickets, Categories header, View all) rămâne neschimbat — deja localizat corect.
