## Obiectiv
Stabilizez experiența pe mobil când se deschide tastatura, astfel încât:
- conversația deschisă să rămână afișată corect, fără să se vadă lista de conversații dedesubt;
- bara de navigație de jos a aplicației să nu mai apară deasupra tastaturii;
- câmpurile de căutare să nu mai forțeze comportamente suplimentare inutile din partea browserului unde putem evita asta;
- să separ clar ce poate fi eliminat din aplicație față de ce este controlat nativ de iOS/tastatură.

## Ce voi schimba
1. Corectez containerul full-screen al chatului mobil din `Messages.tsx` și `MessagesTab.tsx`.
   - Hook-ul actual urmărește doar `visualViewport.height`.
   - Voi urmări și `visualViewport.offsetTop`/poziția vizibilă, ca overlay-ul de chat să rămână aliniat cu viewportul real când tastatura mută suprafața vizibilă.
   - Asta elimină efectul din screenshot în care inputul rămâne sus, iar sub el se vede lista de conversații.

2. Unific logica de viewport într-un hook comun reutilizabil.
   - Mut logica duplicată într-un singur hook pentru chat mobil.
   - Hook-ul va expune variabile CSS pentru înălțime și offset, folosite consecvent în ambele locuri unde există chat full-screen.

3. Întăresc ascunderea navigației mobile globale când tastatura este deschisă.
   - Revizuiesc `useKeyboardOpen` și pragul/detecția sa pentru cazurile reale de iPhone.
   - Mă asigur că `MobileBottomNav` dispare predictibil pe chat, search și alte inputuri, fără flicker sau reapariție peste tastatură.

4. Normalizez inputurile de search care folosesc moduri iOS mai agresive.
   - Verific și ajustez câmpurile care folosesc `type="search"` sau `inputMode="search"` când nu aduc valoare reală.
   - Unde e sigur, le trec pe un comportament text standard pentru a reduce barele/accesoriile suplimentare declanșate de browser.

## Detalii tehnice
- Fișiere țintă probabile:
  - `src/pages/Messages.tsx`
  - `src/components/profile/MessagesTab.tsx`
  - `src/hooks/useKeyboardOpen.ts`
  - `src/components/layout/MobileBottomNav.tsx`
  - `src/components/layout/mobile-drawer/DrawerSearch.tsx`
  - `src/components/home/SmartSearch.tsx`
- Nu voi atinge logica de business a mesajelor; schimbarea rămâne strict în UI/comportament mobil.
- Observație importantă: bara albă cu săgeți și check din screenshot pare în mare parte controlată nativ de iOS / tastatura instalată. Din web putem reduce trigger-ele produse de aplicație și putem elimina suprapunerile noastre, dar dacă tastatura mai afișează o bară proprie, aceea nu poate fi garantat eliminată complet din codul web.

## Validare
Voi verifica explicit:
- listă conversații pe mobil;
- conversație deschisă pe mobil;
- focus în inputul de chat;
- focus în câmpuri de search;
- dispariția barei de navigație de jos la deschiderea tastaturii;
- faptul că nu se mai vede conținutul de fundal sub chat când scrii.