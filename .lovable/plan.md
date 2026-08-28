# Eliminarea butoanelor CTA din cardurile de notificare

## Context
Cardurile de notificare (`NotificationCard`) afișează în prezent un buton de acțiune rapidă (ex: "Răspunde", "Plătește acum", "Deschide chatul") pentru anumite tipuri de notificări. Utilizatorul dorește eliminarea acestor butoane, deoarece click-ul pe întreaga notificare deja navighează către destinația relevantă, făcând butonul redundant.

## Obiectiv
Elimina butoanele de acțiune din interiorul cardurilor de notificare, păstrând intacte layout-ul compact, iconițele, gruparea temporală și navigarea la click.

## Modificări planificate

### 1. `src/components/notifications/NotificationCard.tsx`
- **Șterge funcția `getQuickAction`** — nu mai este necesară.
- **Șterge importurile nefolosite**:
  - `Button` din `@/components/ui/button`
  - `ArrowRight` din `lucide-react`
- **Șterge blocul JSX `{action && (...)}`** care randează butonul CTA sub descrierea notificării.
- **Păstrează**:
  - click handler pe întreg cardul (`handleClick`);
  - iconița, titlul, descrierea, timestamp-ul și dot-ul de unread;
  - clasele de hover/focus și layout-ul compact existent.

## Verificare
1. Build TypeScript/Vite fără erori (verificare importuri neutilizate eliminate corect).
2. Verificare vizuală în:
   - dropdown-ul de notificări din header (desktop);
   - sheet-ul de notificări (mobile);
   - pagina dedicată `/notificari`.
3. Confirmare că notificările rămân clickable pe întreaga suprafață și că navigarea la `mapLink` funcționează ca înainte.
