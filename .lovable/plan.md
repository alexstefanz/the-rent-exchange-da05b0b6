

# Ajustari vizuale cereri + imagini produse

## Schimbari

### 1. RequestsTab - Layout butoane si pret (RequestsTab.tsx)

**Pret centrat si mai bold:**
- Pretul (`{request.subtotal} RON`) va fi pe un rand separat, centrat, cu `text-lg font-bold`

**Butoane pe rand nou:**
- Butoanele "Anuleaza" si "Contacteaza proprietarul" se muta pe un rand separat sub pret, cu `flex justify-center gap-2 mt-3`

**Imagini complet vizibile:**
- Imaginile din cereri se schimba de la `object-cover` la `object-contain` cu `bg-white` ca fundal

Aceleasi modificari se aplica si sectiunii de cereri anulate.

### 2. ProductCard - Fundal alb pentru imagini (ProductCard.tsx)

- Container-ul imaginii se schimba de la `bg-muted` la `bg-white` pentru ca spatiul gol din jurul imaginilor cu aspect ratio diferit sa fie alb (nu gri)
- Se aplica atat pentru gallery view cat si pentru list view

## Fisiere modificate

| Fisier | Schimbare |
|--------|-----------|
| `src/components/dashboard/RequestsTab.tsx` | Butoane pe rand nou, pret centrat/bold, imagini object-contain cu bg-white (pending + cancelled) |
| `src/components/products/ProductCard.tsx` | bg-muted -> bg-white pe container-ul imaginii (gallery + list view) |

