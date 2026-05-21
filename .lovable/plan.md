## Problema

Funcția RPC `get_contact_info_if_in_conversation` (folosită în panoul de chat „Contact" și pentru butonul de telefon din header) deblochează numărul de telefon și emailul când:

- `payment_status IN ('authorized','paid')`, **SAU**
- `status IN ('confirmed','active','completed')`

Asta înseamnă că de îndată ce proprietarul dă **Accept** pe cerere (status devine `confirmed`, dar `payment_status` rămâne `pending` până când chiriașul plătește), datele de contact devin deja vizibile în chat. Date reale în DB: 22 rezervări `confirmed` au `payment_status = pending`.

## Soluție

Actualizez funcția să deblocheze contactul **doar după ce plata este cel puțin autorizată** (cardul a fost validat / banii sunt blocați sau încasați).

Condiția nouă:
```
payment_status IN ('authorized', 'paid', 'captured', 'partially_refunded', 'refunded')
```

Nu mai folosim `status` ca cale alternativă de deblocare — există rezervări cu `status = active/completed` dar `payment_status = pending` (legacy), iar regula cerută este strict legată de plată.

## Migrație

`CREATE OR REPLACE FUNCTION public.get_contact_info_if_in_conversation(owner_uuid uuid)` cu noul `WHERE` care cere existența unei rezervări între cei doi cu `payment_status` în lista de mai sus. Restul (semnătura, `SECURITY DEFINER`, `search_path`) rămân identice, deci frontendul (ChatPanel, InfoPanel) nu necesită modificări.

## Efect vizibil

- Înainte de plată: tab-ul „Contact" din chat afișează „Datele de contact vor fi vizibile după plată." și butonul de apel din header nu mai apare.
- După ce chiriașul plătește (`authorized`/`captured`/`paid`): contactul devine vizibil normal, în ambele sensuri (proprietar ↔ chiriaș).
