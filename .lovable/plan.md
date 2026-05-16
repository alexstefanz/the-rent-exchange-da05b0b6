## Problemă

În panoul de admin (`/admin/reservations`), când se expandează o rezervare, se vede doar timeline-ul + câteva date sumare. Nu există acces la pagina completă a închirierii (PV-uri, sumar financiar, părți, produs etc.) — aceeași vedere pe care o au proprietarul și chiriașul la `/rezervari/RNT-XXXXXX`.

## Soluție

Adăugăm în panoul expandat din admin un buton clar `Deschide pagina închirierii` care navighează către `/rezervari/{public_id}` (în tab nou, pentru ca admin-ul să nu piardă filtrele și paginarea din ERP).

Pagina `RentalDetailPage` deja se ocupă singură de tot conținutul (stepper complet, PV-uri, sumar financiar, predare devansată, produs închiriat, contraparte, chat etc.). Trebuie doar să ne asigurăm că admin-ul o poate accesa fără să fie owner/renter.

## Modificări

### 1. `src/pages/admin/AdminReservations.tsx`

În `RentalExpandedPanel`, sus de tot (în bara cu `Hash` + ID Rezervare), adaug în dreapta un buton:

```
<Button asChild size="sm" variant="outline">
  <a href={`/rezervari/${rental.public_id}`} target="_blank" rel="noopener">
    <ExternalLink className="h-4 w-4 mr-2" />
    Deschide pagina închirierii
  </a>
</Button>
```

(import `ExternalLink` din lucide-react)

### 2. `src/pages/RentalDetailPage.tsx` — acces pentru admin

Pagina folosește RPC-ul `get_rental_by_public_id` și apoi verifică `renter_id === user.id || owner_id === user.id`. Trebuie să:

- Permitem accesul când utilizatorul curent are rolul `admin` (`has_role`). Verificăm explicit cu un mic helper pe client (`useIsAdmin` există deja în proiect — voi verifica și folosesc patternul existent, altfel fac un `select 1 from user_roles`).
- Bypass-uim secțiunile interactive care nu au sens pentru admin (`EarlyReturnCard`, butonul „Lasă un review", chat-ul propriu) — le ascundem dacă utilizatorul nu e nici renter nici owner, ci doar admin. Adminul vede totul read-only.
- Datele de contraparte / contact: admin-ul vede ambele părți. Adăugăm un mic card suplimentar „Chiriaș" + „Proprietar" cu nume/email/telefon (read-only). Datele există deja în răspunsul RPC; doar UI suplimentar.

Dacă RPC-ul `get_rental_by_public_id` nu returnează rentalul când caller-ul nu e participant, vom extinde funcția SQL să accepte și admin (`OR has_role(auth.uid(),'admin')`). Verific întâi codul RPC; dacă întoarce deja datele (DEFINER), e suficient client-side gating.

### 3. Mic UX

- Pe rândul rezervării din tabel, adaug un mic `ExternalLink` icon-button lângă `public_id` care face același lucru — shortcut fără a fi necesar să expandezi.

## Ce NU se schimbă

- Lifecycle-ul / acțiunile admin (confirm/cancel/etc.) rămân unde sunt în panoul expandat — pagina deschisă este informativă.
- Nu se atinge chat-ul / RLS-ul mesajelor; adminul are deja policies de read pe conversations/messages.
