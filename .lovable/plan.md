# Refacere chat desktop Rentli (UI/UX, fără schimbări de logică)

## Credite
- Disponibil acum: ~28,7 credite (din top-up). Estimare pentru această refacere: aproximativ 8–15 credite (câteva componente de chat rescrise + verificare desktop/tabletă/mobil). Ar trebui să ajungă, cu rezervă pentru 1–2 ajustări mici după.

## Ce se schimbă
1. **Lista conversațiilor (stânga, ~320px)**: titlu „Mesaje” + badge necitite, căutare „Caută conversații...”, taburi Toate / Active / Arhivate. Fiecare rând: avatar, punct online, nume, oră, ultimul mesaj, produs trunchiat discret, badge necitite. Scot eticheta de rol, datele și intervalul rezervării. Selecție: fundal portocaliu deschis + linie portocalie în stânga.
2. **Header conversație**: avatar, nume, Online/Offline, „Răspunde de obicei în câteva minute”; dreapta: telefon (doar când e permis, ca acum), meniu „…” (raportează, vezi produs, vezi profil), buton portocaliu „Vezi detalii”. Produsul dispare din header.
3. **Un singur card compact de rezervare** sub header (~90px): poză, nume produs, perioadă · zile, badge status unic, preț, săgeată spre pagina rezervării. Înlocuiește bara „Cerere → Aprobat → Plătit → Predare → Returnat”.
4. **Zona de mesaje**: separatoare „Astăzi” / dată, mesaje primite gri în stânga, trimise portocalii în dreapta cu bife citit, ore mici. Mesajele automate (plată etc.) devin carduri de eveniment portocaliu deschis, max ~520px.
5. **Scriere mesaj**: [atașament] [câmp cu emoji] [trimite rotund portocaliu], fixat jos, compact.
6. **Panou dreapta (~360px)** cu taburi Detalii | Media (fără „Linkuri”): Produs închiriat → Persoană (Sună / Vezi profil / Raportează) → Detalii rezervare (perioadă, durată, valoare, ID RNT) → „Blochează utilizatorul” contur roșu jos.
7. **Tabletă**: panoul din dreapta se deschide ca sertar din „Vezi detalii”. **Mobil**: listă → conversație; detaliile ca ecran/foaie de jos.

## Ce rămâne neschimbat
Trimiterea mesajelor, blocarea datelor de contact, plata, statusurile, media, apel, raportare, blocare, notificări, timp real — doar se mută în locul potrivit.

## Detalii tehnice
- Fișiere: `Messages.tsx`, `profile/MessagesTab.tsx`, `messaging/ConversationList.tsx`, `ChatHeader.tsx`, `ChatPanel.tsx`, `InfoPanel.tsx`, `MessageBubble.tsx`, `SystemMessageBubble.tsx`, `MessageInput.tsx`; componente noi `BookingSummaryCard` și `RentalStatusBadge` (mapare status → etichetă RO/EN, reutilizabilă).
- „Active” = rezervare neîncheiată/neanulată; „Arhivate” = finalizate/anulate (derivat din statusul existent, fără coloană nouă). Căutare locală după nume/produs/ultimul mesaj.
- „Răspunde de obicei…” text static (nu există date reale de timp de răspuns).
- `RentalStageStepper` scos din chat (rămâne pe pagina rezervării). Culorile prin tokenuri semantice existente; accentul navy pentru chiriaș se păstrează doar ca detaliu discret.
- Verificare cu capturi la 1440px, 900px și 390px, plus build.
