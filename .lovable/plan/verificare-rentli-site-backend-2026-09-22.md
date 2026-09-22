# Verificare Rentli: site + backend

Verific pe rând cele 7 zone, direct pe aplicația care rulează, cu conturi de test și date de test. La final primești o listă de probleme, ordonate după gravitate, cu ce e stricat și unde.

## Ce verific

### 1. Autentificare, cont nou și recuperare parolă
- Înregistrare cu email + parolă, mesajele de eroare (parolă slabă, email deja folosit, prea multe încercări).
- Cod de confirmare pe SMS și intrarea în cont imediat după înregistrare.
- Autentificare cu Google, revenirea pe pagina corectă după login.
- „Am uitat parola": emailul pleacă, linkul deschide formularul de parolă nouă, parola nouă funcționează.
- Paginile private redirecționează spre autentificare când nu ești logat.

### 2. Profil și datele contului
- Editare nume, telefon, poză de profil; verificarea telefonului prin cod.
- Cont persoană fizică vs. firmă (CUI, Reg. Com., adresă) și preluarea datelor după CUI.
- IBAN pentru încasări, soldul din portofel, retragerile.
- Setări de notificări, dezactivare cont.
- Ce câmpuri sunt blocate la editare și dacă regulile de acces le protejează corect.

### 3. Flux proprietar: creare și administrare anunț
- Toți cei 6 pași de publicare, inclusiv lista „Ce este inclus", pozele, prețul și comisionul afișat.
- Salvarea ca ciornă și reluarea ei.
- Trecerea prin aprobarea administratorului și vizibilitatea publică.
- Editare, dezactivare, cerere de ștergere; scorul de calitate.
- Pagina „Anunțurile mele": statistici, filtre, disponibilitate.

### 4. Flux chiriaș: căutare, produs, rezervare
- Căutare, filtre, hartă, paginile de categorie.
- Pagina de produs: galerie, disponibilitate, vizualizări, produse similare.
- Rezervare: calcul preț + comision, zile blocate, plata din portofel și plata cu cardul (card de test, fără bani reali).
- Acceptarea/refuzul cererii de către proprietar, anulări și rambursări.

### 5. Chat și mesagerie
- Pornirea unei conversații de pe produs și conversația legată de o rezervare.
- Blocarea datelor de contact înainte de plată și permiterea lor după plată, inclusiv mesaje normale cu prețuri și date.
- Atașamente (poze), mesaje necitite, actualizare în timp real, blocare utilizator, raportare mesaj.

### 6. Notificări pentru evenimente critice
- Ce se trimite la: cerere nouă, acceptare, plată, predare, returnare, anulare, mesaj nou.
- Clopoțelul din site, emailurile (verific în jurnalul platformei că au plecat) și SMS-urile.
- Linkurile din notificări duc la pagina corectă.
- Ferestrele de tip pop-up pentru cereri noi.
- Notificările push native nu pot fi testate aici — îți spun doar ce pregătire există în backend pentru ele.

### 7. Accesări: cameră, fotografii și altele
- În site: încărcarea pozelor la anunțuri, la poza de profil, la documentul de predare și în chat (inclusiv fotografiere directă de pe telefon), comprimarea imaginilor, limitele de mărime și tipurile acceptate.
- Locația în browser (harta de proximitate) și comportamentul când utilizatorul refuză.
- Permisiunile native ale aplicației de telefon nu intră aici — se verifică în aplicația Emergent.

## Cum lucrez

- Creez conturi de test noi și un anunț de test; folosesc cardul de test Stripe, fără plăți reale.
- Emailurile și SMS-urile nu ajung la clienți reali — verific doar în jurnalele platformei că au fost trimise.
- La final șterg datele de test create.
- Nu fac corecții în această etapă: îți raportez problemele, apoi stabilim împreună ce reparăm și în ce ordine.

## Detalii tehnice

- Testare în browser automatizat pe aplicația locală, plus interogări în baza de date pentru a confirma starea reală (rezervări, tranzacții, jurnal de emailuri/SMS, jurnal de activitate).
- Verific jurnalele funcțiilor de server pentru erori la plăți, notificări, generare document și traduceri.
- Verific regulile de acces (RLS) pentru tabelele atinse de fluxurile de mai sus, ca datele unui utilizator să nu fie vizibile altuia.
