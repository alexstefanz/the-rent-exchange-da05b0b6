## Obiectiv
Elimin experiența deranjantă de deasupra tastaturii pe mobil în toate ecranele de chat și verific explicit comportamentul pe iPhone pentru Safari și Chrome.

## Problema exactă
Screenshot-ul arată două lucruri distincte:
1. zona/composer-ul aplicației, pe care o putem controla;
2. bara nativă iOS de tip input assistant (cu săgeți/check), pe care web-ul nu o poate ascunde direct în Safari/Chrome.

Planul meu este să scot complet orice spațiu sau strat inutil generat de aplicație și să reduc toate trigger-ele posibile din DOM, astfel încât să rămână doar ce este impus nativ de iOS.

## Ce voi implementa
1. Audit complet al tuturor inputurilor de chat mobile
- Verific `MessageInput`, `SupportChatWidget`, `TicketChat` și containerele lor.
- Elimin orice padding, safe-area, footer fix, spacer sau wrapper care mai rămâne deasupra tastaturii când inputul este focusat.

2. Unific detecția de tastatură pentru toate chaturile
- Scot logica duplicată de `visualViewport` și o mut pe un comportament comun, coerent.
- Fac composer-ul să se lipească de viewport-ul vizibil real când tastatura este deschisă.

3. Curăț trigger-ele care fac iOS să creadă că are mai multe câmpuri navigabile
- Verific toate câmpurile focusabile din chaturi și orice input temporar/ascuns.
- Mă asigur că rămâne un singur control editabil activ în fluxul de scriere, fără accesorii suplimentare declanșate de aplicație.

4. Corectez layout-ul pe toate suprafețele de chat mobile
- `/mesaje`
- widgetul de suport
- ticket chat / alte ecrane de conversație
- Dacă există alte componente de chat reutilizate, le aliniez la același comportament.

5. Validez comportamentul pe iPhone viewport
- Verific deschiderea tastaturii, focus în textarea, trimitere mesaj, atașamente, back/close.
- Confirm că dispare complet orice fâșie albă sau spațiu generat de aplicație.
- Dacă mai rămâne bara cu săgeți/check, o marchez explicit ca limitare nativă iOS/WebKit, nu bug UI al aplicației.

## Fișiere țintă
- `src/components/messaging/MessageInput.tsx`
- `src/components/messaging/ChatPanel.tsx`
- `src/components/support/SupportChatWidget.tsx`
- `src/components/support/center/TicketChat.tsx`
- `src/hooks/useKeyboardOpen.ts`
- posibil și hook-ul comun de viewport/chat dacă trebuie unificat

## Detalii tehnice
- Safari și Chrome pe iPhone folosesc același motor WebKit, deci bara nativă se comportă similar în ambele.
- Din cod web pot elimina doar elementele/controlul aplicației: padding, safe-area rezidual, focus-uri parazite, inputuri ascunse, moduri de input inutile.
- Nu voi modifica logica de business a mesajelor; schimbarea rămâne strict la nivel de UX/layout/focus pe mobil.

## Rezultat urmărit
- fără fâșie albă între input și tastatură;
- fără elemente ale aplicației deasupra tastaturii;
- același comportament coerent în `/mesaje` și în celelalte chaturi;
- confirmare clară a ce a fost eliminat din aplicație și ce rămâne nativ pe iPhone.