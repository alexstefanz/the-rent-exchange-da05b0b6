# Dezactivarea tuturor notificărilor toast

## Scop
Eliminarea completă a mesajelor temporare plutitoare de pe întregul site, inclusiv confirmări, erori, avertismente și notificări în timp real.

## Implementare
1. Elimin componenta globală care afișează toast-urile. În prezent, aceasta este montată o singură dată pentru toată aplicația.
2. Păstrez neschimbate procesele care rulează în fundal și notificările salvate în Centrul de notificări; doar mesajele plutitoare nu vor mai apărea.
3. Păstrez mesajele afișate direct în pagini și formulare, astfel încât validările și erorile importante deja integrate în interfață să rămână vizibile.
4. Verific pe desktop și mobil că autentificarea/deconectarea și câteva acțiuni uzuale nu mai afișează niciun toast și că paginile continuă să funcționeze normal.

## Detalii tehnice
- Se elimină randarea globală `Sonner` din rădăcina aplicației.
- Nu se modifică individual zecile de apeluri existente; fără afișatorul global, nici sistemul modern, nici compatibilitatea veche nu mai pot reda toast-uri.
- Nu se dezactivează emailurile, SMS-urile, notificările din baza de date sau popup-urile funcționale ale procesului de închiriere.
