

## Plan: Redirecționare la pagina produsului după anularea plății

Problema: Când utilizatorul anulează plata Stripe, este dus pe `/checkout/cancelled` care are doar un link către pagina principală.

### Soluție

**1. Edge function `create-checkout-session/index.ts`** — includ slug-ul produsului în `cancel_url`:
```
cancel_url: `${origin}/produs/${product_slug}`
```
Produsul deja e încărcat în rental (`products:product_id(title, images, slug)`). Folosesc slug-ul direct din produs, sau îl generez din titlu dacă lipsește.

**2. Elimină pagina `CheckoutCancelled.tsx`** — nu mai e necesară, Stripe va redirecționa direct pe pagina produsului.

Alternativ, păstrez `CheckoutCancelled` dar redirecționez automat — dar varianta directă e mai simplă și mai bună UX.

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `supabase/functions/create-checkout-session/index.ts` | Fetch `slug` din products, construiesc cancel_url cu `/produs/{slug}` |

