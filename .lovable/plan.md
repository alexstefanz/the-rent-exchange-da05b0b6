

## Plan: Reorder NewProduct form and show commission under price

### Changes to `src/pages/NewProduct.tsx`

1. **Reorder form fields** to: Titlu → Imagini → Categorie/Subcategorie → Preț
2. **Under price input**, show a live calculation of the client price (owner price + 20% commission) and the commission amount, e.g.:
   - "Clientul va plăti: **60 RON** (include 10 RON comision platformă 20%)"
   - Uses `form.watch("daily_price_owner")` to reactively compute

### New field order
```text
1. Titlu (Denumire)
2. Imagini produs
3. Categorie + Subcategorie (grid 2 cols)
4. Preț pe zi — with live commission breakdown below
5. Descriere
6. Oraș + Țară
7. Adresă ridicare
8. Buttons
```

### Files affected
- `src/pages/NewProduct.tsx`

