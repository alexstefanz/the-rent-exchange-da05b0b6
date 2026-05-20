Am găsit cauza: apelul `get_rental_popups` eșuează cu `operator does not exist: text = uuid`, deci componenta nu primește niciun item de afișat. Problema vine din RPC-urile pop-up-ului: `rentals.cancelled_by` este `text`, iar funcțiile îl compară direct cu `owner_id` (`uuid`). Această eroare oprește tot RPC-ul, inclusiv ramura pentru cereri `pending`, de aceea pop-up-ul din imagine nu apare nici când există închirieri noi.

Plan de implementare:

1. Repar RPC-urile pop-up-ului
   - Actualizez `get_rental_popups()` și `get_rental_popup_by_id()` prin migrație.
   - Schimb comparația problematică din `cancelled_by = owner_id` în comparație sigură pe text, de tip `cancelled_by = owner_id::text`.
   - Păstrez comportamentul existent:
     - proprietarul vede cererile `pending`;
     - chiriașul vede cererile `confirmed`/`active` nevăzute;
     - chiriașul vede refuzurile doar când `cancelled_by` este proprietarul.

2. Repar edge function-ul de refuz ca să scrie același tip de date
   - În `respond-rental-request`, păstrez `cancelled_by`, dar îl setez explicit ca string (`user.id`), compatibil cu schema actuală.
   - Nu schimb fluxul de acceptare/refuz sau notificările.

3. Fac UI-ul mai rezilient la erori RPC temporare
   - În `RentalPopupManager`, evit dublarea apelului inițial cauzată de re-render-uri/dev strict mode printr-un guard per utilizator.
   - Opțional, adaug o reîncercare scurtă după o eroare RPC, ca pop-up-ul să apară când cache-ul API-ului se stabilizează după migrații.

4. Verificare
   - Reîncarc pagina ca utilizator autentificat.
   - Confirm în Network că `rpc/get_rental_popups` revine cu 200, nu 404.
   - Confirm vizual că apare pop-up-ul pentru cererile `pending` existente ale proprietarului, ca în imaginea atașată.