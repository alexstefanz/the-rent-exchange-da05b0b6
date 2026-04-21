

## Plan: Diagnostic + fix 404 la `/verificare` pe versiunea publicată

### Cauza identificată

Codul sursă este **corect**:
- Ruta `/verificare` există în `App.tsx:126`
- `KycGateBanner.tsx` folosește `<Link to="/verificare?next=...">` (navigare SPA, client-side)
- Toate referințele vechi `/kyc` au fost curățate în iterația anterioară

**Dar** pagina 404 apare în continuare. Asta indică:

| Scenariu | Explicație | Verificare |
|---|---|---|
| **A. Build publicat învechit** | `rentli.ro` și `the-rent-exchange.lovable.app` rulează un bundle build-uit **înainte** ca ruta `/verificare` să existe sau **înainte** de fix-ul `/kyc → /verificare`. Userul testează pe domeniul publicat, nu pe preview. | Cel mai probabil — fix-urile s-au făcut în mesajele anterioare, dar utilizatorul probabil nu a republicat. |
| **B. Service worker cache** | Browser-ul servește un bundle vechi din cache. | Hard refresh (Ctrl+Shift+R) ar rezolva. |
| **C. Bug subtil în Link** | `nextHref` conține caractere problematice care strică Link-ul. | Improbabil — `encodeURIComponent` este aplicat. |

### Acțiuni propuse

#### 1. Quick wins (fără cod nou)
- **Republicare site**: în Lovable → Publish → "Update Live" — pentru a propaga ruta `/verificare` și fix-ul `/kyc` pe domeniul live. Acesta este pasul **#1**.
- Dacă userul testează pe preview (`*.lovableproject.com`): hard refresh (Ctrl+Shift+R).

#### 2. Hardening defensiv în cod (în caz că publish nu rezolvă)

**Adaug fallback redirect `/kyc → /verificare`** în `App.tsx`, astfel încât orice link vechi (din emailuri trimise, bookmark-uri, sau bundle-uri vechi din cache) să redirecționeze automat în loc să dea 404:

```tsx
<Route path="/kyc" element={<Navigate to="/verificare" replace />} />
<Route path="/kyc/*" element={<Navigate to="/verificare" replace />} />
```

Asta elimină permanent posibilitatea de 404 pe `/kyc`, indiferent de cache sau build vechi.

#### 3. Diagnostic suplimentar (după publish)

Dacă după republicare userul tot primește 404, verific:
- URL-ul exact în bara browserului când apare 404 (pentru a confirma calea)
- Build hash din `<script src="/assets/index-XXX.js">` din HTML-ul publicat vs. preview

### Fișiere modificate

| Fișier | Modificare |
|---|---|
| `src/App.tsx` | Adaug 2 rute Navigate: `/kyc` → `/verificare` și `/kyc/*` → `/verificare` (fallback defensiv) |

### Limitări recunoscute

- Nu putem forța hard-refresh-ul browserului userului din cod
- Republicarea site-ului trebuie făcută manual din UI-ul Lovable
- Dacă toți userii testează doar pe preview, fix-ul Navigate este oricum util pentru linkurile din emailuri care ar putea avea `/kyc` hardcodat

