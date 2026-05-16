Voi corecta navigarea astfel încât butonul de back din conversația deschisă din checkout sau pagina de produs să ducă înapoi exact la pagina de unde s-a apăsat „Discută cu proprietarul”.

Pași:
1. În `Checkout.tsx`, la deschiderea chatului voi trimite către `/mesaje?conv=...` cu `state.returnTo`, păstrând ruta `/checkout` și datele existente din checkout, ca formularul să poată fi refăcut la întoarcere.
2. În `ProductDetail.tsx`, la `handleStartChat` și `handleQuickQuestion`, voi trimite către `/mesaje?conv=...` cu `state.returnTo` setat la URL-ul curent al produsului.
3. În `Messages.tsx`, `handleBack` va verifica `location.state.returnTo`; dacă există și utilizatorul a venit din checkout/produs, va naviga acolo. Dacă nu există, va păstra comportamentul actual: închide conversația și revine la lista de mesaje.
4. Voi păstra fallback-ul existent pentru conversațiile deschise direct din `/mesaje`, rezervări sau notificări, ca să nu schimb fluxurile care nu fac parte din cerere.

Detalii tehnice:
- Se folosește `useLocation` + `navigate(returnTo.pathname + returnTo.search, { state: returnTo.state })`.
- Pentru checkout, `state` va include aceleași date de rezervare, ca pagina să nu afișeze „nu există date” la revenire.
- Nu modific backend-ul și nu schimb structura conversațiilor.