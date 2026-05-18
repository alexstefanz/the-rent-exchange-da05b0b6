Plan:

1. Centralizez afișarea toast-urilor custom într-un singur canal
- În `src/lib/notify.tsx`, înainte de afișarea unui toast custom, voi apela `toast.dismiss()` ca să închid orice toast existent.
- Voi folosi un ID global unic pentru notificările de tip card, nu ID-uri diferite per titlu/tip. Astfel un toast nou îl înlocuiește pe cel existent, nu se adaugă peste el.

2. Întăresc deduplicarea notificărilor venite din backend
- În `src/hooks/useGlobalRealtime.ts`, deduplicarea nu va mai fi doar pe `type`, ci pe o semnătură stabilă: `type + title + description`, cu fereastră mai lungă.
- Voi partaja același set `shown` între realtime, poll și focus refresh, ca același rând din `notifications` să nu fie afișat de două ori când hook-ul se remontează în React StrictMode.

3. Elimin stivuirea vizuală din Sonner
- În `src/components/ui/sonner.tsx`, păstrez `visibleToasts={1}`, `expand={false}`, `gap={0}` și aplic aceleași reguli pe ambele instanțe Sonner.
- Mă asigur că toast-urile bottom-center nu păstrează carduri vechi în fundal.

Rezultat așteptat:
- Indiferent dacă notificarea vine prin realtime, poll sau focus refresh, utilizatorul vede maximum un singur card toast pe ecran.
- Dacă apar două notificări aproape simultan pentru același eveniment, se afișează una singură.