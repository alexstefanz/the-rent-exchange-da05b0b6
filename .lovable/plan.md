## Problemă

Pe pagina chiriaşului şi a proprietarului apar mai multe carduri toast suprapuse pentru acelaşi eveniment de închiriere (ex: „Cerere nouă de închiriere", „Ai anulat cererea"). `visibleToasts={1}` pe Sonner nu rezolvă singur — sunt mai multe notificări reale inserate în DB (din pipeline-uri paralele: `notify-rental-event` + `send-rental-notification` + retry-uri din `pollRecent` la `useGlobalRealtime`) iar Sonner le redă pe rând cu efect de stivă.

## Soluție

### 1. `src/lib/notify.tsx` — coalesce stack via stable sonner ID

În funcţia `show(variant, opts)`, pasează un `id` stabil bazat pe `variant + title` (ex: `notif:${variant}:${slug(title)}`) către `toast.custom`. Sonner garantează că dacă acelaşi `id` e re-emis, înlocuieşte toastul existent în loc să stivuiască. Astfel:

- Două inserturi DB cu acelaşi tip + titlu colapsează într-un singur card vizibil.
- Toaste de tipuri diferite (ex: cerere + plată) rămân distincte.

Add helper `slugify(s: string)` pentru a normaliza titlul (lowercase, trim, înlocuit non-alfanumeric cu `-`, max 60 chars) — nu schimbăm copyul afişat, doar id-ul intern.

### 2. `src/components/ui/sonner.tsx` — păstrăm `visibleToasts={1}` + dezactivăm efectul de stack vizual

- Confirm că `visibleToasts={1}` este pe ambele instanţe (deja făcut).
- Adăugăm `expand={false}` şi `gap={0}` pe Sonner-ul bottom-center ca să elimine cardurile fade din spate când totuşi ajung 2 toasturi diferite simultan.

### 3. `src/hooks/useGlobalRealtime.ts` — dedup mai strict în `showOnce`

`showOnce` deja dedup-uri pe `n.id`. Adăugăm un al doilea nivel: cheie `lastShownByType` (Map în-memory în modul) pe `${n.type}:${n.user_id?}` cu timestamp ultimul afişat; dacă < 5000ms, skip. Acoperă cazul în care backend creează 2 rânduri `notifications` diferite (cu id-uri diferite) pentru acelaşi eveniment în <5s.

## Verificare

- Test manual: creează o cerere de închiriere RNT nouă → o singură notificare bottom-center apare la fiecare parte. Anulează cererea → o singură notificare „Ai anulat cererea".
- Verifică în consolă logul `[notify] showing toast` — chiar dacă apar mai multe inserturi, doar primul declanşează render; restul sunt suprimate de cheia stable sau de fereastra de 5s.

## Notă

Nu modificăm edge functions / pipeline-ul DB — soluţia e pur frontend, sigură şi reversibilă. Dacă în viitor vrei să eliminăm dublarea şi la sursă, putem analiza separat `notify-rental-event` vs `send-rental-notification` pentru a păstra doar unul per eveniment.