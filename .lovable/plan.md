## Reparat notificarile chat + reasezare toast deasupra iconitei de chat

### 1. Notificari realtime pentru chat-ul din header (badge cu numar mesaje necitite)

**Cauza probabila**

`useGlobalRealtime` deja asculta `INSERT` pe `messages` si invalideaza `["conversations", userId]`. Dar evenimentele de pe `messages` depind de RLS — recipientul are politica de SELECT prin join cu `conversations` si in unele cazuri (race intre auth si subscribe, sau cand utilizatorul tocmai s-a logat) realtime nu primeste INSERT-urile pe `messages`. In schimb, `notifications` are deja un trigger per-user fiabil (`filter: user_id=eq.${userId}`) si edge-function-ul `send-message-notification` insereaza un rand cu `type = "new_message"`.

**Fix**

In `src/hooks/useGlobalRealtime.ts`, in handler-ul de `INSERT` pe `notifications`, daca `n.type === "new_message"` invalidez explicit si:
- `["conversations", userId]`
- `["unread-messages", userId]`

Asa, chiar daca evenimentul direct pe `messages` nu ajunge, badge-ul din Navbar se actualizeaza imediat (in <1s).

### 2. Toast-urile sa apara deasupra iconitei FAB de chat din dreapta-jos

**Situatia actuala**

Toast-urile sonner sunt pozitionate `bottom-center`. FAB-ul de chat (`SupportChatWidget`) sta `fixed bottom-20 lg:bottom-6 right-4 z-50` (mobile: ~80px de jos, desktop: ~24px de jos, dimensiune 56px).

**Fix in `src/components/ui/sonner.tsx`**

1. Schimb `position="bottom-center"` in `position="bottom-right"`.
2. Adaug un offset responsive calculat dintr-un `useEffect` cu `matchMedia("(min-width: 1024px)")`:
   - desktop (lg): `offset={{ bottom: 96, right: 16 }}` (deasupra FAB-ului de la `bottom-6` + 56px + spatiu)
   - mobile: `offset={{ bottom: 152, right: 16 }}` (deasupra FAB-ului de la `bottom-20` + 56px + spatiu)
3. Lasam `visibleToasts={1}` si restul setarilor neschimbate.

Astfel toast-urile aluneca peste cardul FAB-ului si raman vizibile pe orice pagina.

### Verificare

- Login → trimiterea unui mesaj de pe alt cont catre user → badge-ul din header creste imediat fara refresh; toast "Mesaj nou de la …" apare in dreapta-jos, vizibil deasupra FAB-ului de chat.
- Toast-ul ramane clickabil (link spre `/mesaje?conv=…`) si butonul de close functioneaza.

### Fisiere modificate

- `src/hooks/useGlobalRealtime.ts`
- `src/components/ui/sonner.tsx`