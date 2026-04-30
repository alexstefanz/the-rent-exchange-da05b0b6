## Audit rezultate — traduceri lipsă

Sistemul de localizare existent: `useLanguage()` cu helper `t(ro, en)` + dicționar `src/data/uxCopy.ts` accesat prin `useUxCopy()`. Categoriile/subcategoriile au deja `nameEn`.

Din ~100 fișiere cu text românesc, ~60 nu importă deloc hook-ul de limbă. Paginile admin (`/admin/*`) sunt intenționat doar RO (instrument intern) — le lăsăm. În plus, paginile legale (TermsAndConditions, PrivacyPolicy, CookiePolicy, CancellationPolicy) sunt documente lungi juridice — le marcăm separat.

### Scope traduceri (fișiere user-facing)

**Pagini publice / cont:**
- `src/pages/Checkout.tsx` — toast-uri ("Trebuie să-ți verifici identitatea…", "Verificare identitate necesară…", "Eroare la inițierea plății…"), butoane ("Se procesează…", "Rezervă — X RON"), texte info Stripe.
- `src/pages/CheckoutCancelled.tsx` — titlu + descriere + buton.
- `src/pages/NewProduct.tsx` și `src/pages/EditProduct.tsx` — titluri secțiuni, butoane, mesaje toast/validare.
- `src/pages/ListItem.tsx` — pagina landing pentru "Adaugă produs".
- `src/pages/Owner.tsx` — header proprietar, etichete.
- `src/pages/Messages.tsx` — header, empty states.
- `src/pages/UserProfile.tsx` — etichete profil public.
- `src/pages/DeactivateAccount.tsx` — flow complet.
- `src/pages/Unsubscribe.tsx` — confirmări email.

**Componente checkout / mesagerie / dashboard:**
- `src/components/checkout/TermsDialog.tsx`, `PaymentMethodDialog.tsx`, `LoginDialog.tsx`.
- `src/components/messaging/ConversationList.tsx`, `ChatPanel.tsx`, `ChatDialog.tsx`, `ContactInfoCard.tsx` — etichete + empty states + tooltip.
- `src/components/dashboard/PayoutStatusBadge.tsx` și `AcceptedRentalDialog.tsx`.
- `src/components/products/ProductCard.tsx`, `ImageUpload.tsx` — texte upload, "Adaugă imagini", erori.
- `src/components/auth/SocialLoginButtons.tsx` — "Continuă cu Google / Apple".

### Abordare tehnică

1. **Extindere `src/data/uxCopy.ts`** cu noi grupuri bilingve:
   - `checkout` (toaste, CTA-uri Stripe, dialog termeni/plată/login)
   - `messaging` (header, empty, contact card, tooltip-uri)
   - `productForm` (NewProduct/EditProduct/ListItem — titluri pași, butoane)
   - `ownerPage`, `userProfile`, `deactivate`, `unsubscribe`, `checkoutCancelled`
   - `payoutStatus`, `socialAuth`, `imageUpload`, `productCard`

2. **În fiecare fișier** se importă `useUxCopy()` (sau, pentru fragmente scurte, `useLanguage` + `t("…", "…")`) și se înlocuiesc literalele românești. Toast-urile rămân în limba curentă selectată.

3. **Verificare automată**: după modificări, rulez `rg -lP "[ÎîȘșȚțĂăÂâ]"` pe fișierele atinse și mă asigur că nu mai rămân șiruri user-facing cu diacritice (excluzând comentarii și label-uri ce trebuie să rămână RO, cum ar fi "RON").

### În afara scope-ului (cu motivare)

- **Paginile `/admin/*` și componentele `src/components/admin/*`** — interfață internă echipă Rentli, rămâne RO. Pot fi traduse separat dacă dorești.
- **Pagini legale** (Termeni, Confidențialitate, Cookie, Anulare) — texte juridice lungi; traducerea necesită revizie legală. Pot fi adăugate într-un task ulterior dacă confirmi că vrei traducere completă (nu doar UI chrome).
- **Email-uri tranzacționale** (`supabase/functions/_shared/...`) — momentan sunt doar RO; traducerea per destinatar necesită stocarea preferinței de limbă pe profil. Separat dacă dorești.

### Întrebare opțională

Vrei să includem și **paginile legale** (traduse complet în EN) sau doar UI chrome (titluri/breadcrumb)? Implicit trec doar UI chrome.

### Livrabile

- `src/data/uxCopy.ts` extins cu noile grupuri.
- ~20 fișiere componente/pagini actualizate să folosească `useUxCopy`/`useLanguage`.
- 0 șiruri user-facing românești hardcodate rămase în fișierele țintă.
