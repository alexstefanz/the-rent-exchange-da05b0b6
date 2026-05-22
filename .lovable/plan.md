# Plasare comutator de limbă în funcție de stare auth

## Comportament dorit

- **Utilizator neautentificat (Navbar desktop)**: butonul RO/EN apare lângă „Autentificare" / „Adaugă anunț nou".
- **Utilizator autentificat (Navbar desktop)**: butonul RO/EN dispare din header; apare în dropdown-ul „My Account" (AccountHubMenu), ca o secțiune dedicată „Limbă / Language" cu segmented switch RO | EN, identic ca stil cu cel din drawer-ul mobil.
- **Pagina `/auth`**: în header-ul paginii (lângă logo) se adaugă același comutator RO/EN, ca utilizatorul să poată schimba limba înainte de login.
- **Mobile**: drawer-ul mobil are deja switch-ul RO/EN — rămâne neschimbat (vizibil pentru ambele stări, e tot „account-side").

## Modificări

1. `src/components/layout/Navbar.tsx`
   - Importă `LanguageSwitcher`.
   - În cluster-ul din dreapta: dacă `!user && !loading`, randează `<LanguageSwitcher />` înainte de butonul „Autentificare".
   - Dacă `user`, NU se afișează în header (rămâne în AccountHubMenu).

2. `src/components/layout/AccountHubMenu.tsx`
   - În `AccountHubBody` (folosit atât pe desktop dropdown cât și pe mobile drawer), adaugă o secțiune nouă „Limbă / Language" deasupra footer-ului (sau înainte de „Setări"), cu segmented switch RO | EN identic ca în `MobileDrawer.tsx` (`LangButton`).
   - Folosește `useLanguage()` (deja importat).

3. `src/pages/Auth.tsx`
   - În header-ul paginii (zona cu logo-ul), adaugă `<LanguageSwitcher />` în partea dreaptă.

## Note tehnice

- `LanguageSwitcher` și logica `LanguageContext` există deja — fără modificări la storage / persistență.
- Nu se modifică nimic pe mobile bottom nav sau pe `MobileDrawer` (acolo există deja switch-ul în header-ul drawer-ului).
- Fără modificări de backend / RLS / DB.
