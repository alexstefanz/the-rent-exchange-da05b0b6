## Obiectiv

Când există mai multe cereri în coadă, popup-ul principal rămâne în prim-plan, iar în spatele lui apar 1-2 carduri "preview" mai mici (stivuite), care sugerează vizual că mai sunt cereri în așteptare. La închiderea celui din față, următorul urcă pe poziția principală cu o animație subtilă, iar stiva din spate se reașează.

Butoanele rămân **Refuză** / **Acceptă** (deja sunt astfel pentru modul owner — nu se schimbă textul).

## Comportament

- 1 cerere → exact ca acum (un singur card).
- 2+ cereri → cardul principal + max 2 carduri "ghost" în spate, ușor scalate (≈0.95, 0.9), translatate în jos (≈10px, 20px) și cu opacitate redusă (≈0.6, 0.35). Nu sunt interactive (pointer-events-none).
- Badge cu numărul rămas ("+N") pe colțul cardului principal (subtil, nu intruziv), vizibil doar când queue.length > 1.
- La accept/refuz/close pe cardul din față: cardul iese cu fade-out + scale-down (≈180ms), cardurile din spate "urcă" simultan (translate/scale tranziție ≈220ms ease-out), iar al doilea preia poziția principală.
- Click pe backdrop închide doar cardul din față (ca acum).

## Implementare tehnică

Modificări limitate la frontend, fără atingere de RPC/edge/business logic.

**`src/components/rentals/RentalPopupManager.tsx`**
- Calculează `visible = queue.slice(0, 3)` (top + max 2 ghosts).
- Render: un container relativ; pentru fiecare element din `visible` cu `index > 0` randează un `<div>` ghost (skeleton-like: aceleași dimensiuni ca popup-ul, fără conținut interactiv — doar avatar + titlu produs estompate sau pur și simplu o copie a cardului cu `pointer-events-none` și `aria-hidden`).
- Stilare ghosts: `absolute inset-0`, `transform: translateY(${i*10}px) scale(${1 - i*0.05})`, `opacity: ${0.6 - (i-1)*0.25}`, `z-index: ${10 - i}`, `transition-all duration-300 ease-out`.
- Cardul principal: `relative z-10`, animație de intrare existentă păstrată; la dismiss aplicăm o stare locală `exitingId` care adaugă `animate-out fade-out zoom-out-95 duration-200` înainte de `removeItem`.
- Badge "+N" în colțul dreapta-sus al cardului principal (lângă X) când `queue.length > 1`, ex: `+2`. Stil discret: pill mic `bg-muted text-muted-foreground text-[10px]`.

**`src/components/rentals/RentalRequestPopup.tsx`**
- Acceptă prop opțional `stackCount?: number` (folosit doar pentru badge-ul "+N").
- Fără alte modificări de conținut/butoane (rămân Refuză/Acceptă).

**Animații** — folosesc clasele Tailwind/`tailwindcss-animate` deja prezente (`animate-in`, `animate-out`, `fade-in`, `zoom-in-95`, `fade-out`, `zoom-out-95`) plus `transition-all` pentru tranziția ghost→front.

## Ce NU se schimbă

- RPC-uri, edge functions, schema DB.
- Logica de accept/reject/markSeen.
- Layout/poziționarea generală (bottom-right desktop / bottom mobil, backdrop).
- Textul butoanelor (deja Refuză/Acceptă pentru owner).
