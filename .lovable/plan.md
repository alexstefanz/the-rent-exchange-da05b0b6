## Problemă

În `src/components/rentals/RentalPopupManager.tsx`, popup-ul de cerere pentru proprietar este alimentat din `fetchRentalPopups()` la mount + un canal realtime care ascultă DOAR `INSERT` pe `rentals` filtrat pe `owner_id=eq.<uid>`. Nu există listener pentru `UPDATE` pe `owner_id`.

Consecință: dacă rezervarea iese din starea `pending` cât timp popup-ul e deschis (chiriașul își anulează cererea, sau proprietarul a acceptat/refuzat dintr-un alt tab/dispozitiv), popup-ul rămâne afișat cu o cerere „fantomă". La click pe **Acceptă**, edge function-ul `respond-rental-request` verifică `rental.status !== "pending"` și returnează `400 "Rental is not pending"`, iar `supabase.functions.invoke` aruncă „Edge Function returned a non-2xx status code".

Logs-urile confirmă scenariul: la 08:04:57 chiriașul a anulat cererea (toast `request_cancelled_by_renter`), apoi proprietarul a încercat să accepte popup-ul deja invalid.

## Plan

### 1. `src/components/rentals/RentalPopupManager.tsx` — listener UPDATE pe owner

În canalul realtime `rental-popups-${user.id}`, adaug un al treilea handler:

```ts
.on(
  "postgres_changes",
  { event: "UPDATE", schema: "public", table: "rentals", filter: `owner_id=eq.${user.id}` },
  (payload: any) => {
    const row = payload.new;
    // Dacă rezervarea pe care o avem în coadă nu mai e pending,
    // o scoatem ca să nu mai poată fi acceptată dintr-o stare invalidă.
    if (row?.id && row.status !== "pending") {
      removeItem(row.id);
    }
  },
)
```

Asta închide popup-ul automat când:
- chiriașul anulează cererea (status devine `cancelled`)
- proprietarul a răspuns din alt tab (status devine `confirmed` sau `cancelled`)
- orice altă tranziție din `pending`

### 2. `src/components/rentals/RentalPopupManager.tsx` — mesaj clar în `handleAccept` / `handleReject`

Capturez explicit cazul în care funcția întoarce eroare pentru o cerere care nu mai e pending și afișez un mesaj prietenos în loc de „Edge Function returned a non-2xx status code".

```ts
const handleAccept = async () => {
  try {
    await respondToRental(current.id, "accept");
    toast.success("Rezervare confirmată");
    invalidate();
    removeItem(current.id);
    // ... restul logicii de redirect existente
  } catch (e: any) {
    const raw = String(e?.message || e?.context?.message || "");
    // Trimite mesaj în română pentru cazul cel mai frecvent
    if (raw.includes("not pending") || raw.includes("non-2xx")) {
      toast.error("Cererea nu mai este disponibilă (a fost anulată sau procesată).");
      removeItem(current.id);
      invalidate();
    } else {
      toast.error(raw || "Eroare la confirmare");
    }
  }
};
```

Același tratament în `handleReject`.

### 3. (opțional, robust) `src/features/rentals/ownerRentalsApi.ts` — propagare body de eroare

`supabase.functions.invoke` întoarce un `FunctionsHttpError` al cărui `.message` e generic („Edge Function returned a non-2xx status code"). Body-ul JSON (cu `error: "Rental is not pending"`) e în `error.context.json()`. Modific `respondToRental` să citească body-ul când există:

```ts
export async function respondToRental(rentalId: string, action: "accept" | "reject", reason?: string) {
  const { data, error } = await supabase.functions.invoke("respond-rental-request", {
    body: { rental_id: rentalId, action, reason },
  });
  if (error) {
    try {
      const body = await (error as any).context?.json?.();
      if (body?.error) throw new Error(body.error);
    } catch (parseErr) {
      // ignoră, cădem pe error original
    }
    throw error;
  }
  return data;
}
```

Beneficiu: orice apelant (popup + `RentalsOutTab` + `RentalDetailPage`) primește mesajul real, nu „non-2xx status code".

## Files
- `src/components/rentals/RentalPopupManager.tsx` — listener UPDATE pe owner_id; mesaj clar pe accept/reject când rezervarea nu mai e pending.
- `src/features/rentals/ownerRentalsApi.ts` — extrage body-ul JSON al erorii din edge function ca să propage mesajul real.
