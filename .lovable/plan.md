## Adaugare reguli personalizate în "Reguli de utilizare"

În pasul 2 din wizardul de publicare, secțiunea "Reguli de utilizare" oferă acum doar chip-uri presetate (din `DEFAULT_USAGE_RULES`). Le păstrăm, dar adăugăm exact același pattern de input + buton "+" ca la "Ce este inclus", pentru a permite adăugarea de reguli proprii.

### Modificări (frontend only, `src/components/publish/PublishWizard.tsx`)

1. Adaug un nou state local `newRule` (alături de `newItem`).
2. Sub label-ul "Reguli de utilizare", adaug un rând cu `<Input>` + buton `+` identic cu cel de la "Ce este inclus":
   - placeholder: `Ex: Doar în interior, fără copii sub 12 ani`
   - Enter sau click pe `+` adaugă în `data.usage_rules` (dacă nu există deja, după `trim()`).
3. Sub input păstrez chip-urile presetate `DEFAULT_USAGE_RULES` (toggle on/off ca acum).
4. Adaug, sub chip-uri, o listă cu regulile **custom** adăugate de utilizator (cele care NU sunt în `DEFAULT_USAGE_RULES`), afișate ca pill-uri cu `X` pentru ștergere — exact stilul de la `included_items`.

### Out of scope
- Fără modificări la schemă, RPC, validări sau alte fișiere.
- Fără modificări la `LivePreviewCard` sau pagina produsului (deja citesc `usage_rules` ca array).
