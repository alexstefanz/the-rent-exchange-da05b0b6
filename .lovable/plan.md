# Alert pentru limbaj licențios în chat

## Comportament curent

În `src/components/messaging/MessageInput.tsx`, la trimitere (Enter sau click pe Send), dacă textul conține un cuvânt din lista `containsProfanity`, mesajul este blocat și se afișează un **toast** discret. Mulți useri nu îl observă.

## Comportament dorit

- Detecția rămâne identică (`containsProfanity`).
- Când userul apasă **Enter** (sau Send) cu limbaj licențios, mesajul NU este trimis (deja așa este) ȘI se deschide un **AlertDialog modal** (nu toast), bilingv, cu titlu, descriere și un singur buton „Am înțeles / Got it".
- Mesajul rămâne în input pentru ca userul să-l corecteze.
- Toast-ul existent este înlocuit cu acest dialog modal (mai vizibil, mai serios).

## Conținut alert

- **Titlu RO**: „Limbaj licențios detectat"
  **EN**: „Offensive language detected"
- **Descriere RO**: „Mesajul tău conține limbaj nepotrivit și nu poate fi trimis. Conturile care folosesc limbaj licențios sau ofensator pot fi avertizate, restricționate sau suspendate definitiv. Te rugăm să comunici respectuos."
  **EN**: „Your message contains inappropriate language and cannot be sent. Accounts that use offensive or abusive language may be warned, restricted, or permanently suspended. Please communicate respectfully."
- **Buton**: „Am înțeles" / „Got it"

## Modificări

1. `src/components/messaging/MessageInput.tsx`
   - Adaugă state `profanityAlertOpen`.
   - În `handleSend`: când `containsProfanity(content).hit` → `setProfanityAlertOpen(true)` în loc de `toast.error` și return.
   - Randează `<AlertDialog>` (shadcn) la finalul componentului cu conținutul bilingv de mai sus.
   - `handleKey` rămâne neschimbat (apelează `handleSend`, care acum deschide alertul).

## Note

- Fără modificări la `profanityFilter.ts` sau la trigger-ul DB `check_message_profanity` — lista rămâne aceeași.
- Fără modificări de backend.
