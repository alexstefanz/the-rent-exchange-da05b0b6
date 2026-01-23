
# Unificare Formular Adăugare Produse

## Problema Identificată

Există două pagini diferite pentru adăugarea produselor:

| Aspect | `/adauga-anunt` (ListItem) | `/owner/new-product` (NewProduct) |
|--------|---------------------------|-----------------------------------|
| **Limbă** | Engleză | Română |
| **Salvare DB** | NU salvează | Salvează în Supabase |
| **Validare** | Basic | Zod schema |
| **Categorii** | mockItems (vechi) | categories.ts (cele 22) |
| **Subcategorii** | Lipsă | Implementat |
| **UI** | Carduri shadow | Card simplu, curat |

Butonul "Adaugă" din header duce la formularul vechi care nu funcționează corect.

---

## Soluție

Voi redirecționa toate link-urile de "Adaugă" către `/owner/new-product` și voi elimina pagina veche `ListItem.tsx`.

---

## Modificări Necesare

### 1. Fișier: `src/components/layout/Navbar.tsx`

**Desktop - Buton header (linia 223):**
```typescript
// De la:
<Link to="/adauga-anunt">

// La:
<Link to="/owner/new-product">
```

**Desktop - Dropdown menu (linia 195):**
```typescript
// De la:
<Link to="/adauga-anunt" className="flex items-center gap-3 py-2">

// La:
<Link to="/owner/new-product" className="flex items-center gap-3 py-2">
```

**Mobile - Menu link (linia 311):**
```typescript
// De la:
<Link to="/adauga-anunt" ...>

// La:
<Link to="/owner/new-product" ...>
```

---

### 2. Fișier: `src/App.tsx`

**Redirecționare rută veche (pentru backward compatibility):**
```typescript
// Modificare linia 44:
// De la:
<Route path="/adauga-anunt" element={<ListItem />} />

// La: Redirect către noul formular
import { Navigate } from "react-router-dom";
<Route path="/adauga-anunt" element={<Navigate to="/owner/new-product" replace />} />
```

---

## Rezumat Schimbări

| Fișier | Locație | Modificare |
|--------|---------|-----------|
| `Navbar.tsx` | Linia 223 | Header button → `/owner/new-product` |
| `Navbar.tsx` | Linia 195 | Dropdown link → `/owner/new-product` |
| `Navbar.tsx` | Linia 311 | Mobile menu → `/owner/new-product` |
| `App.tsx` | Linia 44 | Redirect `/adauga-anunt` → `/owner/new-product` |

---

## Rezultat Final

- Toate butoanele "Adaugă" vor duce la formularul corect din screenshot
- Formularul în română cu toate cele 22 de categorii
- Salvare reală în baza de date
- Validare Zod pentru date
- Opțiune subcategorii funcțională
- Link-uri vechi (`/adauga-anunt`) vor redirecționa automat

---

## Notă Opțională

După implementare, fișierul `src/pages/ListItem.tsx` poate fi șters deoarece nu mai este folosit. Îl putem păstra deocamdată pentru siguranță sau îl ștergem complet.
