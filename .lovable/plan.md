# Carduri Chiriaș/Proprietar și chat comun

## Rezultat
- Cardul „Chiriaș” va apărea permanent în meniul contului, inclusiv când utilizatorul nu are închirieri active sau finalizate.
- Cardul „Proprietar” rămâne portocaliu, iar cardul „Chiriaș” primește o identitate navy blue, în română și engleză.
- Pagina Mesaje devine o singură listă comună, fără separarea obligatorie în două taburi.
- Fiecare conversație va afișa clar rolul utilizatorului în acea rezervare:
  - „Chiriaș” cu accent navy când utilizatorul este cumpărătorul/beneficiarul închirierii;
  - „Proprietar” cu accent portocaliu când utilizatorul deține produsul.
- Chatul, mesajele, conversațiile și linkurile existente rămân comune; nu se creează două sisteme separate.

## Modificări
1. Elimin condiția care ascunde cardul „Chiriaș” din meniul contului.
2. Aplic culorile cerute cardurilor și folosesc aceleași accente în lista conversațiilor.
3. Înlocuiesc taburile „Rezervări” și „De închiriat” cu lista unică; păstrez accesul către suport separat.
4. Actualizez atât pagina principală Mesaje, cât și varianta Mesaje din cont, pentru comportament identic pe desktop și mobil.
5. Păstrez selectarea conversației prin link și deschiderea directă a conversațiilor existente.

## Test chat admin–utilizator
- În prezent nu există nicio conversație și niciun anunț asociat conturilor `office@rentli.ro` și `z.alexstefan@gmail.com`, deci testul necesită date temporare controlate.
- Voi crea un anunț și o conversație temporară între cele două conturi, voi trimite câte un mesaj în fiecare sens și voi verifica:
  - apariția conversației în lista comună;
  - eticheta și culoarea corectă pentru fiecare rol;
  - livrarea și afișarea mesajelor;
  - starea citit/necitit și actualizarea în timp real;
  - jurnalul trimiterii emailului de notificare, fără a presupune livrarea în inbox.
- La final șterg toate datele temporare create pentru test.

## Verificare finală
- Verific pagina și meniul la dimensiuni desktop și mobil.
- Verific lipsa erorilor de afișare, funcționare și compilare.

## Detalii tehnice
- Rolul conversației este derivat din `buyer_id` și `owner_id`; nu se schimbă structura bazei de date.
- Culorile vor folosi tokenuri semantice, inclusiv un token navy reutilizabil, fără valori vizuale izolate în componente.
- Testul nu va modifica datele reale ale celor două conturi, în afară de mesajele temporare eliminate la final.
