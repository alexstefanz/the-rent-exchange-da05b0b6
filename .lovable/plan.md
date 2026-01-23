

# Header Enhancement: Avatar, Notificări, Language Switcher și Meniu Complet

## Rezumat

Voi adăuga în header-ul aplicației:
1. **Avatar utilizator** cu poză din profil (sau inițiale fallback)
2. **Secțiune notificări** cu icon clopoțel și badge pentru notificări noi
3. **Language switcher** pentru Română/Engleză
4. **Meniu dropdown complet** la click pe avatar cu toate opțiunile cerute
5. **Pagină Centru de Ajutor** similară cu rentx.ro

---

## Structura Meniului Dropdown (la click pe avatar)

| Secțiune | Opțiuni | Iconiță |
|----------|---------|---------|
| Profil | Contul meu | User |
| | Anunțurile mele | FileText |
| | Rezervări | CalendarCheck |
| | Mesaje | MessageCircle |
| | Favorite | Heart |
| Separator | --- | --- |
| Acțiuni | Adaugă un anunț | PlusCircle |
| | Centru de asistență | HelpCircle |
| Separator | --- | --- |
| | Ieși din cont | LogOut |

---

## Fișiere de Creat/Modificat

### 1. Context pentru Limbă (NOU)
**Fișier:** `src/contexts/LanguageContext.tsx`

- Context React pentru gestionarea limbii curente
- Salvare în localStorage pentru persistență
- Suport pentru "ro" și "en"

### 2. Hook pentru Profil în Navbar
**Fișier:** `src/hooks/queries/useCurrentUserProfile.ts`

- Query pentru a încărca profilul utilizatorului curent (avatar_url, full_name)
- Folosit în Navbar pentru afișarea avatarului

### 3. Componentă Language Switcher
**Fișier:** `src/components/layout/LanguageSwitcher.tsx`

- Dropdown sau toggle între RO/EN
- Folosește LanguageContext pentru a schimba limba

### 4. Componentă Notifications Bell
**Fișier:** `src/components/layout/NotificationBell.tsx`

- Icon clopoțel cu badge pentru notificări necitite
- Dropdown cu lista notificărilor
- Pregătit pentru integrare viitoare cu baza de date

### 5. Navbar Update
**Fișier:** `src/components/layout/Navbar.tsx`

**Modificări:**
- Înlocuiește butonul text cu Avatar component
- Adaugă NotificationBell
- Adaugă LanguageSwitcher
- Extinde DropdownMenu cu toate opțiunile cerute
- Grupează opțiunile cu separatori vizuali

### 6. Pagina Centru de Ajutor (NOU)
**Fișier:** `src/pages/HelpCenter.tsx`

Layout similar cu rentx.ro:
- Header cu titlu și search bar
- 3 carduri principale:
  - **Întrebări frecvente (FAQ)**
  - **Asistență/Contact**
  - **Feedback**

### 7. App Routes Update
**Fișier:** `src/App.tsx`

- Adaugă ruta `/centru-asistenta` pentru HelpCenter
- Wrap cu LanguageProvider

---

## Structura Dropdown Menu

```text
DropdownMenuContent:
├── DropdownMenuItem: Contul meu → /profile
├── DropdownMenuItem: Anunțurile mele → /owner
├── DropdownMenuItem: Rezervări → /rezervari
├── DropdownMenuItem: Mesaje → /mesaje
├── DropdownMenuItem: Favorite → /profile#favorite
├── DropdownMenuSeparator
├── DropdownMenuItem: Adaugă un anunț → /adauga-anunt
├── DropdownMenuItem: Centru de asistență → /centru-asistenta
├── DropdownMenuSeparator
└── DropdownMenuItem: Ieși din cont → signOut()
```

---

## Help Center Page Layout

```text
┌─────────────────────────────────────────────────┐
│                    NAVBAR                        │
├─────────────────────────────────────────────────┤
│                                                  │
│           Centru de Asistență                    │
│                                                  │
│    ┌─────────────────────────────────────┐      │
│    │        🔍 Caută ajutor...            │      │
│    └─────────────────────────────────────┘      │
│                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │    📋      │ │    💬      │ │    📝      │   │
│  │  Întrebări │ │ Asistență  │ │  Feedback  │   │
│  │  frecvente │ │  Contact   │ │            │   │
│  │     →      │ │     →      │ │     →      │   │
│  └────────────┘ └────────────┘ └────────────┘   │
│                                                  │
│           Articole populare                      │
│  ┌─────────────────────────────────────────┐    │
│  │ • Cum să închiriez un produs?           │    │
│  │ • Cum să adaug un anunț?                │    │
│  │ • Politica de anulare                   │    │
│  │ • Metode de plată acceptate             │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
├─────────────────────────────────────────────────┤
│                    FOOTER                        │
└─────────────────────────────────────────────────┘
```

---

## Language Switcher Design

```text
Dropdown simplu:
┌──────────┐
│ 🇷🇴 RO ▼ │  ← Afișează limba curentă
└──────────┘
    │
    ▼
┌──────────────┐
│ 🇷🇴 Română   │
│ 🇬🇧 English  │
└──────────────┘
```

---

## Notification Bell Design

```text
┌─────┐
│ 🔔  │  ← Clopoțel cu badge roșu dacă sunt notificări
└─────┘
    │ (click)
    ▼
┌────────────────────────────────────┐
│ Notificări                          │
├────────────────────────────────────┤
│ • Mesaj nou de la Ion              │
│ • Rezervare confirmată             │
│ • Produs vizualizat de 5 ori       │
├────────────────────────────────────┤
│ Vezi toate notificările            │
└────────────────────────────────────┘
```

---

## Pași de Implementare

| # | Task | Fișier |
|---|------|--------|
| 1 | Creează LanguageContext | `src/contexts/LanguageContext.tsx` |
| 2 | Creează hook pentru profilul curent | `src/hooks/queries/useCurrentUserProfile.ts` |
| 3 | Creează LanguageSwitcher | `src/components/layout/LanguageSwitcher.tsx` |
| 4 | Creează NotificationBell | `src/components/layout/NotificationBell.tsx` |
| 5 | Actualizează Navbar cu toate componentele | `src/components/layout/Navbar.tsx` |
| 6 | Creează pagina HelpCenter | `src/pages/HelpCenter.tsx` |
| 7 | Adaugă ruta și LanguageProvider în App.tsx | `src/App.tsx` |

---

## Dependențe Existente Folosite

- `@radix-ui/react-avatar` - Pentru componenta Avatar
- `@radix-ui/react-dropdown-menu` - Pentru meniu dropdown
- `lucide-react` - Pentru iconițe (Bell, User, Heart, etc.)
- Componente UI existente din `src/components/ui/`

---

## Considerații Mobile

- Pe mobil, avatarul și notificările vor fi vizibile în header
- Language switcher va fi în meniul off-canvas pe mobil
- Dropdown-ul complet va funcționa pe toate dispozitivele

