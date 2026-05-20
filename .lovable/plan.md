# Fix: header dispare la deschiderea meniului user

## Cauza bugului

Header-ul din `src/components/layout/Navbar.tsx` folosește `className="fixed lg:sticky top-0 z-50 ..."` — deci pe desktop este `position: sticky`.

`AccountHubMenu` (desktop) folosește `<DropdownMenu>` de la Radix care, **implicit, este modal** (`modal={true}`). Asta înseamnă că la deschidere blochează scroll-ul pe `<body>` (prin `RemoveScroll` → `overflow: hidden` pe body/html).

Efect secundar: când body-ul nu mai poate fi scrollat, `position: sticky` al header-ului degenerează la poziția sa naturală în flux. Dacă pagina era scrollată în jos, header-ul "sare" la poziția lui reală din document (sus, în afara viewport-ului) → **header dispare**. În același timp, conținutul dropdown-ului — poziționat de Radix Popper relativ la trigger — apare ancorat sus și o parte iese deasupra viewport-ului → **cardul de cont nu mai e accesibil**.

## Soluția

Setăm `modal={false}` pe `<DropdownMenu>` în `AccountHubMenu`. Asta:
- păstrează scroll-ul pe body activ → header-ul `sticky` rămâne fixat sus
- păstrează poziționarea corectă a dropdown-ului sub trigger
- nu afectează închiderea pe click-outside / Escape (funcționează în continuare)

## Modificări (1 fișier)

**`src/components/layout/AccountHubMenu.tsx`** (linia ~540):
```diff
- <DropdownMenu open={open} onOpenChange={setOpen}>
+ <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
```

Atât. Versiunea mobile (Sheet) nu e afectată — Sheet-ul e intenționat modal și header-ul nu trebuie să rămână vizibil acolo.

## Verificare după implementare

Deschid preview-ul, scrolez pagina puțin în jos, dau click pe avatarul din header și confirm că:
1. Header-ul rămâne vizibil sus
2. Dropdown-ul se deschide complet sub trigger
3. Header card (avatar + nume + progres profil) e vizibil și clickable
