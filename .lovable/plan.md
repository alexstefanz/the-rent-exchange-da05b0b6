## Problemă

În widget-ul de chat de suport (vizualizare admin → "Inbox suport"), cardurile cu tickete se întind dincolo de marginea dreaptă a widget-ului. Titlul lung și ultimul mesaj (ex: `Acțiune necesară pe https://dashboard.stripe.com/payments/pi_...`) ies din card și se taie de viewport în loc să fie trunchiate cu `…`.

## Cauza

Cardurile au deja `w-full min-w-0 overflow-hidden`, `truncate` și `line-clamp-1 break-all`, deci markup-ul e corect. Containerul-părinte este însă `<ScrollArea>` (Radix), al cărui viewport interior aplică `display: table` pe wrapper-ul de conținut. `display: table` îi permite să se lățească după conținut, ceea ce face inutile constrângerile `min-w-0` / `truncate` din interior — copiii cresc orizontal împreună cu textul lung al ticketului.

Același pattern este folosit pentru lista de arhivă a ticketelor (mai jos în același fișier), deci aceeași problemă apare și acolo când titlurile/mesajele sunt lungi.

## Modificări

Fișier: `src/components/support/SupportChatWidget.tsx`

1. Înlocuiesc `<ScrollArea className="flex-1 px-3 py-3">` din zona **admin inbox** (în jurul liniei 1019) cu un `<div className="flex-1 overflow-y-auto px-3 py-3 min-w-0">`. Astfel containerul respectă lățimea părintelui și `truncate` / `line-clamp-1` funcționează corect.
2. Aceeași schimbare pentru `<ScrollArea>` din **arhiva ticketelor** (în jurul liniei 1097), pentru consistență și pentru a preveni aceeași problemă acolo.
3. Curăț importul `ScrollArea` dacă nu mai e folosit nicăieri în fișier (verific cu un grep înainte).

Nu schimb nimic la logica de date, layout-ul cardului, dimensiuni sau stilizare — doar containerul de scroll, ca trunchierea textului să devină vizibilă.

## Verificare

- Vizual în preview: deschid widget-ul ca admin, confirm că ticketul `TCK-000020` cu URL Stripe lung apare cu titlu și subtitlu trunchiate (`…`) în interiorul cardului, fără overflow lateral.
- Verific și lista de arhivă cu un titlu lung pentru regresie.
