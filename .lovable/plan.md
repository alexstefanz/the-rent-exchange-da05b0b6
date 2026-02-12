
# Scroll to top la navigare

## Problema
React Router nu face scroll to top automat la schimbarea rutei. Cand navighezi pe o pagina noua, ramai la aceeasi pozitie de scroll ca pe pagina anterioara.

## Solutie
Creez un component `ScrollToTop` care asculta schimbarile de ruta si face `window.scrollTo(0, 0)` la fiecare navigare. Il adaug in `App.tsx` in interiorul `BrowserRouter`.

## Detalii tehnice

| Fisier | Schimbare |
|--------|-----------|
| `src/components/ScrollToTop.tsx` | Component nou: foloseste `useLocation` din react-router-dom si un `useEffect` care apeleaza `window.scrollTo(0, 0)` la fiecare schimbare de `pathname` |
| `src/App.tsx` | Import si adaug `<ScrollToTop />` imediat dupa `<BrowserRouter>`, inainte de `<Routes>` |

Aceasta rezolva problema pe toate device-urile (desktop, tableta, mobil) fara alte modificari.
