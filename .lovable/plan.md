## Modificări header (desktop)

### 1. Bara de sus (`src/components/layout/Navbar.tsx`)
Reorganizez zona din dreapta (vizibilă doar pe desktop, `lg:flex`). Ordinea finală, de la stânga la dreapta:

1. **Chat** — buton/link nou către `/mesaje` cu iconul `MessageCircle` + textul „Chat" / „Chat" și badge roșu pentru `unreadMessagesCount` (deja calculat în Navbar).
2. **Favorite** — buton-link nou către `/favorite` cu iconul `Heart`.
3. **Notificări** — `<NotificationBell />` (există deja).
4. **Cont** — `<AccountHubMenu />` (avatar + dropdown), cu o etichetă text „Contul tău" / „Your account" afișată lângă avatar pe desktop (vezi punctul 3).
5. **Adaugă anunț nou** — butonul portocaliu existent (textul rămâne „Adaugă" pe desktop sau îl actualizez la „Adaugă anunț nou" pentru a se potrivi cu mockup-ul; confirmă dacă vrei textul mai lung).

Eliminat: `<LanguageSwitcher />` din bara desktop (rămâne doar pe mobil, dacă există în drawer; altfel doar în meniul de cont — vezi punctul 2).

### 2. Comutator limbă mutat în dropdown-ul „Contul tău" (`src/components/layout/AccountHubMenu.tsx`)
În `FooterZone`, înlocuiesc `<LanguageSwitcher />` (dropdown cu un singur buton) cu **două butoane segmentate RO / EN**, exact cum apar în drawer-ul de mobil:

```text
[ RO ] [ EN ]   ────────   [ Ieși din cont ]
```

- Butonul activ: `bg-primary/10 text-primary` + `ring-1 ring-primary/30`.
- Butonul inactiv: `text-muted-foreground hover:bg-muted`.
- Click → `setLanguage("ro" | "en")` din `useLanguage()`.
- Înlocuiesc importul `LanguageSwitcher` (devine nefolosit aici).

Aplic aceeași schimbare și în varianta `Sheet` mobilă a `AccountHubMenu`, ca să arate identic.

### 3. Etichetă „Contul tău" lângă avatar
În `AccountHubMenu`, modific `trigger`-ul desktop ca să fie un `Button variant="ghost"` lat, nu doar `size="icon"`: avatar 28-32px + text „Contul tău" / „Your account" în dreapta, păstrând punctul de notificare/admin.

### 4. Curățare
- Șterg importul `LanguageSwitcher` din `Navbar.tsx`.
- Las `LanguageSwitcher.tsx` neatins (nu îl mai folosim, dar nu îl șterg ca să nu sparg eventuale referințe — dacă vrei îl pot șterge complet).

### Detalii tehnice (frontend)
- Nu se schimbă rutele, hook-urile sau API-ul; folosesc datele deja disponibile (`useConversations` pentru badge-ul Chat este deja în `Navbar.tsx`).
- Iconurile vin din `lucide-react` (`MessageCircle`, `Heart`, deja importate).
- Nu se atinge logica de business sau backend.
