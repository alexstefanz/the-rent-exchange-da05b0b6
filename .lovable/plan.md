# Buton portocaliu „Vezi produs" în header chat

## Schimbare

În `src/components/messaging/ChatHeader.tsx`:

- Înlocuiește butonul-icon `Package` (varianta `ghost`, doar icon) cu un **buton portocaliu cu text**:
  - Variant: `default` (folosește `bg-primary` = #F59E0B), `size="sm"`
  - Conținut: icon `Package` (h-4 w-4) + text `t("Vezi produs", "View product")`
  - `asChild` pe `Link to={productUrl}`
- Butonul telefon rămâne cum este (icon ghost), condiționat de `showPhone && phone` — apare doar după ce plata a fost confirmată (logica deja setată în `ChatPanel` prin `!!rentalCtx?.paid_at || rentalCtx?.payment_status === "paid"`).
- Cele două butoane sunt mutual exclusive: înainte de plată → buton portocaliu „Vezi produs"; după plată → icon telefon.

Niciun alt fișier nu se modifică.
