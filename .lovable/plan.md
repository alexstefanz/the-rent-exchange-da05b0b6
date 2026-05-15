# Aliniere card produs homepage cu pagina de categorie

## Context
Pe `/categorie/...` cardurile folosesc `ProductCard` cu un layout flex-column unde prețul este împins la baza cardului (`mt-auto pt-3.5`), astfel toate prețurile se aliniază pe aceeași linie indiferent de lungimea titlului. Pe homepage, în `FeaturedListings.tsx`, cardurile nu folosesc `mt-auto` deci prețurile "saltă" în funcție de cât de lung e titlul. În plus, titlul este randat cu `font-heading` și `font-bold` la `md:text-xl`, ceea ce diferă de stilul cerut (text body).

## Modificări — un singur fișier

**`src/components/home/FeaturedListings.tsx`** (cardul de produs din grila `displayProducts.map`):

1. **Container info section** — adaugă `flex flex-col` pe `<div className="p-3 md:p-4">` ca să permită `mt-auto` pentru preț.

2. **Titlu produs** — schimbă din:
   ```tsx
   <h3 className="font-heading text-sm text-foreground line-clamp-2 md:text-xl font-bold">
   ```
   în (font body, dimensiune body, aliniază înălțimea ca pe categorie):
   ```tsx
   <h3 className="text-sm md:text-base text-foreground line-clamp-2 font-medium min-h-[2.5rem] md:min-h-[3rem]">
   ```

3. **Bloc preț** — schimbă din `<div className="mt-2 md:mt-3">` în `<div className="mt-auto pt-3.5">` și aliniază clasele cu cele din `ProductCard`:
   ```tsx
   <div className="mt-auto pt-3.5">
     <span className="font-heading text-lg md:text-xl font-bold text-primary">
       {clientPrice} RON
     </span>
     <span className="text-xs md:text-sm text-muted-foreground"> {copy.common.perDay}</span>
   </div>
   ```

## În afara scopului
- Nu modific `ProductCard.tsx` (deja este referința).
- Nu ating `SeeAllCard`, badge-ul de categorie, imaginea sau butonul de favorit.
- Nu modific alte secțiuni ale homepage-ului.
