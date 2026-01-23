
# Dashboard Utilizator - Transformare Pagina Profil

## Rezumat

Voi transforma pagina actuală `/profile` într-un dashboard complet cu tab-uri, similar cu screenshot-ul furnizat. Dashboard-ul va avea 5 secțiuni principale:

1. **Contul meu** - Starea contului, schimbare parolă, dezactivare cont, metode de plată
2. **Profilul meu** - Editare informații personale (formularul actual)
3. **Mesaje** - Lista conversațiilor (integrat din pagina Messages existentă)
4. **Câștiguri** - Vizualizare venituri din închirieri
5. **Notificări** - Lista tuturor notificărilor

---

## Layout Dashboard

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                              NAVBAR                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Contul Meu                                                              │
│  Gestionează setările și preferințele contului tău                       │
│                                                                          │
│  ┌──────────┬──────────────┬─────────┬───────────┬─────────────┐        │
│  │ Contul   │ Profilul meu │ Mesaje  │ Câștiguri │ Notificări  │        │
│  │   meu    │              │         │           │             │        │
│  └──────────┴──────────────┴─────────┴───────────┴─────────────┘        │
│                                                                          │
│  ┌─────────────────────────────┐    ┌─────────────────────────────┐     │
│  │  Starea contului            │    │  Metoda de plată             │     │
│  │  ✓ Email verificat          │    │  Adaugă o metodă de plată    │     │
│  │  ⚠ Identitate neverificată  │    │                              │     │
│  │  ⚠ Telefon neverificat      │    │  Cum primești banii?         │     │
│  └─────────────────────────────┘    │  Configurează încasarea      │     │
│                                      └─────────────────────────────┘     │
│  ┌─────────────────────────────┐                                         │
│  │  Schimbă parola             │    ┌─────────────────────────────┐     │
│  │  [Schimbă parola]           │    │  💳 Plăți sigure             │     │
│  └─────────────────────────────┘    │  Info despre protecția       │     │
│                                      │  plăților                    │     │
│  ┌─────────────────────────────┐    └─────────────────────────────┘     │
│  │  Dezactivare cont           │                                         │
│  │  [Dezactivează]             │                                         │
│  └─────────────────────────────┘                                         │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                              FOOTER                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Fișiere de Creat

### 1. Componente Dashboard (NOI)
| Fișier | Descriere |
|--------|-----------|
| `src/components/profile/AccountTab.tsx` | Tab-ul "Contul meu" - stare cont, parolă, dezactivare, plăți |
| `src/components/profile/ProfileTab.tsx` | Tab-ul "Profilul meu" - formularul existent mutat aici |
| `src/components/profile/MessagesTab.tsx` | Tab-ul "Mesaje" - lista conversații |
| `src/components/profile/EarningsTab.tsx` | Tab-ul "Câștiguri" - statistici venituri |
| `src/components/profile/NotificationsTab.tsx` | Tab-ul "Notificări" - toate notificările |

### 2. Pagina Profile Refactorizată
| Fișier | Modificare |
|--------|-----------|
| `src/pages/Profile.tsx` | Complet refactorizat cu sistemul de tab-uri |

---

## Detalii pe Fiecare Tab

### Tab 1: Contul Meu

**Secțiuni:**
- **Starea contului** - cu iconițe verzi/roșii pentru status verificare
  - Email (verificat/neverificat)
  - Identitate (verificată/neverificată)
  - Telefon (verificat/neverificat)
- **Schimbă parola** - buton care deschide dialog sau trimite email reset
- **Dezactivare cont** - buton cu confirmare
- **Metoda de plată** - adaugă card pentru rezervări
- **Cum primești banii** - configurare IBAN pentru plăți

### Tab 2: Profilul Meu

**Conținut:**
- Formularul existent cu:
  - Nume complet
  - Telefon
  - Email contact public
  - WhatsApp
- Adăugare avatar upload

### Tab 3: Mesaje

**Conținut:**
- Lista conversațiilor (reutilizăm logica din Messages.tsx)
- Dialog de chat la click

### Tab 4: Câștiguri

**Conținut:**
- Statistici:
  - Total câștiguri luna curentă
  - Total câștiguri total
  - Număr închirieri
- Tabel cu istoricul tranzacțiilor
- Grafic simplu cu câștigurile pe luni

### Tab 5: Notificări

**Conținut:**
- Lista tuturor notificărilor
- Marcare ca citite
- Filtrare pe tip

---

## Implementare Tehnică

### Tab-uri cu URL Hash
Voi folosi URL hash pentru a păstra starea tab-ului:
- `/profile#contul-meu`
- `/profile#profil`
- `/profile#mesaje`
- `/profile#castiguri`
- `/profile#notificari`

Acest lucru permite navigare directă din header dropdown.

### Structura Codului pentru Profile.tsx

```text
Profile.tsx:
├── Tabs (din shadcn/ui)
├── TabsList (cu iconițe și text)
├── TabsContent pentru fiecare secțiune
│   ├── AccountTab
│   ├── ProfileTab  
│   ├── MessagesTab
│   ├── EarningsTab
│   └── NotificationsTab
```

### Stilizare Tab-uri (similar screenshot)
- Tab activ: fundal primary, text alb
- Tab inactiv: fundal transparent, border
- Iconițe pentru fiecare tab
- Responsive pe mobil (horizontal scroll sau stacked)

---

## Pași de Implementare

| # | Task | Fișier |
|---|------|--------|
| 1 | Creează AccountTab | `src/components/profile/AccountTab.tsx` |
| 2 | Creează ProfileTab (mută formular) | `src/components/profile/ProfileTab.tsx` |
| 3 | Creează MessagesTab | `src/components/profile/MessagesTab.tsx` |
| 4 | Creează EarningsTab | `src/components/profile/EarningsTab.tsx` |
| 5 | Creează NotificationsTab | `src/components/profile/NotificationsTab.tsx` |
| 6 | Refactorizează Profile.tsx cu tabs | `src/pages/Profile.tsx` |
| 7 | Actualizează link-urile din Navbar | `src/components/layout/Navbar.tsx` |

---

## Iconițe Folosite (Lucide)

| Tab | Iconiță |
|-----|---------|
| Contul meu | `UserCog` sau `Settings` |
| Profilul meu | `User` |
| Mesaje | `MessageCircle` |
| Câștiguri | `Wallet` sau `DollarSign` |
| Notificări | `Bell` |

---

## Note pentru Implementare

1. **Câștiguri Tab**: Pentru moment va fi mock data, deoarece nu există încă un sistem de rezervări complete cu plăți. Pregătit pentru integrare viitoare.

2. **Notificări Tab**: Va folosi mock data similar cu NotificationBell, pregătit pentru integrare cu o tabelă de notificări în baza de date.

3. **Verificări Cont**: Status-urile de verificare (identitate, telefon) vor fi mock pentru moment - funcționalitatea reală poate fi adăugată ulterior.

4. **Responsive Design**: Pe mobil, tab-urile vor fi scrollabile orizontal sau aranjate într-un select dropdown.
