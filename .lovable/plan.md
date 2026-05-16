Voi face fixul în zona de mesagerie, ca să acopere atât pagina de produs, cât și checkout-ul și orice alt buton care trimite către `/mesaje?conv=...`.

Plan:
1. Actualizez `Messages.tsx` ca atunci când există `conv` în URL să nu se bazeze doar pe lista de conversații cache-uită.
2. Dacă ID-ul conversației din URL nu este găsit în lista curentă, pagina va reîmprospăta conversațiile și va încerca din nou selecția automată.
3. Păstrez comportamentul existent pentru `/mesaje` fără `conv`: lista rămâne deschisă și utilizatorul selectează manual conversația.
4. Ajustez opțional `ProductDetail.tsx` și `Checkout.tsx` să invalideze cache-ul conversațiilor imediat după `getOrCreateConversation`, înainte de navigarea la chat, ca fluxul să fie instant și stabil.
5. Verific apoi toate navigările către `/mesaje?conv=...` ca să folosească aceeași logică și să nu mai apară ecranul „Selectează o conversație...” după click pe „Întreabă proprietarul” / „Deschide chat”.

Detalii tehnice:
- Problema probabilă este cache-ul React Query: conversația nou creată există, dar lista din `Messages.tsx` poate fi încă veche, deci `conv` din URL nu se găsește și chat-ul rămâne neselectat.
- Fixul central în `Messages.tsx` previne aceeași problemă și pentru alte intrări în chat, nu doar pentru produs și checkout.