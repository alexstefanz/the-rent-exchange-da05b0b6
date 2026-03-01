

## Plan: Restructure Help Center Page

### What changes

The Help Center page (`/centru-asistenta`) will be updated to have 3 sections inline (cards that expand/navigate):

1. **Intrebari frecvente** -- Links to the existing FAQ page (`/intrebari-frecvente`)
2. **Asistenta & Contact** -- Instead of linking to a sub-route, clicking opens/scrolls to a contact form section on the same page with fields: Nume, E-mail, Subiect, Mesaj, file upload (max 3 files, 5MB each). Submits via `mailto:office@rentli.ro` or sends email via edge function.
3. **Feedback** -- Replaces "Ghiduri & Tutoriale". Shows a feedback form with emoji rating (5 levels), feedback type selection (Sugestie / Ceva nu a mers bine / Compliment), and a submit button. Also sends to `office@rentli.ro`.

### Technical approach

**File: `src/pages/HelpCenter.tsx`** -- Major rewrite:
- Update the 3 category cards: FAQ links to `/intrebari-frecvente`, the other two scroll to form sections below
- Add **Asistenta section** below cards: a card with form fields (Nume*, E-mail*, Subiect*, Mesaj*), file upload area (max 3 files, 5MB), and "Trimite" button. On submit, opens a `mailto:office@rentli.ro` link with subject and body populated, or shows a toast confirmation
- Add **Feedback section**: a card with "Parerea ta conteaza!" header, 5 emoji rating buttons, 3 type-selection cards (Sugestie, Ceva nu a mers bine, Compliment), and "Trimite" button. Same email target
- Remove the "Popular Articles" section and the old bottom contact section since they're replaced by the new inline forms
- Both forms use `mailto:office@rentli.ro` to send data (no backend needed)

**No routing changes needed** -- FAQ already has `/intrebari-frecvente` route. The contact and feedback forms live directly on the HelpCenter page.

### Form behavior
- Both forms construct a `mailto:` link with pre-filled subject/body and open the user's email client
- File upload in the contact form is visual only (mailto can't attach files) -- alternatively we can show a toast saying "Please attach files to the email that opens"
- Validation with required fields before submission

