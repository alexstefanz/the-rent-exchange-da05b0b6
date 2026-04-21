

## Plan: Afișare nume autori în chat-ul de suport

### Context
În prezent, mesajele din chat-ul de suport (atât panoul admin `/admin/tickets/:id`, cât și panoul utilizator `/suport`) afișează doar tipul autorului ("ADMIN", "CUSTOMER", "Tu", "Suport") fără numele real al persoanei. Imaginea atașată confirmă acest lucru — vezi notele cu doar "Notă internă" fără identificare.

### Soluție
Rezolv `author_id` din tabela `ops_ticket_messages` la numele real din `profiles.full_name` și afișez numele lângă rolul autorului în ambele interfețe.

### Modificări

**1. `src/features/admin/opsTicketsApi.ts`** — îmbogățire mesaje cu nume autor
- Modific `fetchTicketMessages` să facă un join lateral: pentru fiecare `author_id` distinct, fetch `full_name` din `profiles`
- Adaug câmpul opțional `author_name?: string | null` în interfața `OpsTicketMessage`
- Aplic aceeași logică în `src/features/tickets/userTicketsApi.ts` pentru `fetchUserTicketMessages`

**2. `src/pages/admin/AdminTicketDetail.tsx`** — afișare nume în timeline (admin)
- Linia 182: lângă badge-ul `author_type` (ex. "ADMIN", "CUSTOMER", "SYSTEM"), afișez numele:
  - Format: `Admin · Maria Ionescu` sau `Client · Andrei Popa`
  - Pentru `SYSTEM` rămâne doar "Sistem"
- Etichete localizate: `ADMIN → Admin`, `CUSTOMER → Client`, `OWNER → Proprietar`, `SYSTEM → Sistem`

**3. `src/pages/UserTickets.tsx`** — afișare nume în timeline (user)
- Linia 230-233: înlocuiesc "Tu / Suport" cu:
  - Pentru mesajele proprii: rămâne "Tu" (e clar că e utilizatorul curent)
  - Pentru mesajele admin: afișez `Suport · [Nume admin]` (ex. "Suport · Maria Ionescu")
  - Pentru SYSTEM: rămâne "Sistem"
- Versiune EN: "You", "Support · Maria Ionescu", "System"

### Layout vizual

```text
┌─────────────────────────────────────────┐
│ 🔒 Notă internă · Admin: Maria Ionescu  │
│ 18:34                                   │
│ Am contactat ownerul telefonic...       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Client: Andrei Popa                     │
│ 18:03                                   │
│ vuyfuyguyvguy                           │
└─────────────────────────────────────────┘
```

În panoul user (`/suport`):
```text
┌─────────────────────────────────────────┐
│ Suport · Maria Ionescu      18:34       │
│ Mulțumim pentru sesizare...             │
└─────────────────────────────────────────┘
                    ┌────────────────────┐
                    │ Tu          18:03  │
                    │ Salut, am o ...    │
                    └────────────────────┘
```

### Securitate
- Numele admin sunt deja expuse în interfața admin (RLS permite adminilor să vadă profile)
- Pentru utilizatori (`/suport`), expun doar `full_name` al admin-ului care răspunde — informație publică acceptabilă în context de suport (la fel cum un agent de call-center se prezintă)
- Folosesc `profiles.full_name` (deja accesibil prin RLS existent), fără a expune `email` sau alte date sensibile

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/features/admin/opsTicketsApi.ts` | `fetchTicketMessages` îmbogățit cu `author_name`, tip `OpsTicketMessage` updated |
| `src/features/tickets/userTicketsApi.ts` | `fetchUserTicketMessages` îmbogățit cu `author_name` |
| `src/pages/admin/AdminTicketDetail.tsx` | Afișare `Rol · Nume` în header mesaj |
| `src/pages/UserTickets.tsx` | Afișare `Suport · Nume admin` pentru răspunsuri admin |

