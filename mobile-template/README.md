# Rentli Mobile Starter (Expo + TypeScript)

Template de start pentru aplicația nativă generată în Emergent, conectată la
același backend ca web app-ul Rentli. Copiază fișierele din acest folder în
proiectul Expo (structura este pentru `expo-router`).

## 1. Dependențe

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage \
  react-native-url-polyfill expo-router expo-linking expo-web-browser expo-secure-store
```

## 2. Variabile de mediu (`.env` în proiectul Expo)

```bash
EXPO_PUBLIC_SUPABASE_URL=<aceeași valoare ca VITE_SUPABASE_URL din web app>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<aceeași valoare ca VITE_SUPABASE_PUBLISHABLE_KEY din web app>
```

Valorile exacte se găsesc în `.env`-ul web app-ului. Sunt chei publice (anon), deci pot intra în build-ul mobil.

## 3. Config Expo (`app.json`)

```json
{
  "expo": {
    "scheme": "rentli",
    "ios": { "bundleIdentifier": "com.emergent.mobilemarketplace.da8t0c" },
    "android": { "package": "com.emergent.mobilemarketplace.da8t0c" },
    "plugins": ["expo-router"]
  }
}
```

## 4. Redirect URLs în Lovable Cloud (Auth → URL Configuration)

- `https://rentli.ro/auth/callback`
- `https://www.rentli.ro/auth/callback`
- `rentli://auth/callback`
- `com.emergent.mobilemarketplace.da8t0c://auth/callback`

## 5. Ce conține template-ul

| Fișier | Rol |
| --- | --- |
| `lib/supabase.ts` | Client Supabase cu AsyncStorage + refresh de sesiune |
| `lib/auth.tsx` | Context de autentificare (email/parolă + Google OAuth prin deep link) |
| `lib/api.ts` | Funcții de citire produse / detalii / favorite / conversații |
| `app/_layout.tsx` | Root layout cu AuthProvider |
| `app/login.tsx` | Ecran de autentificare |
| `app/(tabs)/index.tsx` | Listă produse (căutare + refresh) |
| `app/product/[slug].tsx` | Detaliu produs |
| `components/ProductCard.tsx` | Card produs reutilizabil |

Toate apelurile folosesc RLS-ul și RPC-urile existente — nu se dublează logica de business.

Detalii complete despre RPC-uri, edge functions și realtime: vezi `../MOBILE_INTEGRATION.md`.