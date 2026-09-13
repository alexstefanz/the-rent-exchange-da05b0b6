# Cerere: adăugare redirecturi OAuth mobile pentru Google

## Context
Aplicația mobilă Rentli folosește logarea cu Google prin `supabase-js` direct, iar fluxul necesită ca URL-urile de redirect folosite de aplicație să fie în lista de redirecturi permise din backend.

Pe web, Google OAuth funcționează deja. Mobile eșuează pentru că schemele `rentli://` și `exp://` nu sunt încă în allowlist.

## Valorile exacte de adăugat

Adaugă, te rog, în **Auth Settings → Advanced → Redirect URLs** (sau secțiunea echivalentă din Lovable Cloud) următoarele URL-uri, **fără a șterge redirecturile web existente**:

```text
rentli://auth/callback
rentli://**
exp://**
```

## De ce sunt necesare

- `rentli://auth/callback` – build nativ iOS/Android (producție).
- `rentli://**` – wildcard de siguranță pentru alte căi/eventuale deep-linkuri din buildul nativ.
- `exp://**` – testare în Expo Go, unde URL-ul de redirect conține IP/port variabil (ex: `exp://192.168.x.x:8081/--/auth/callback`).

Codul mobil folosește:

```ts
const redirectTo = Linking.createURL("/auth/callback");
```

ceea ce generează `rentli://auth/callback` în build nativ și `exp://...` în Expo Go.

## Domeniu publicat

`rentli.ro` / `www.rentli.ro`

## Provider vizat

Google OAuth (sign-in mobil).

## Testare după adăugare

1. Logare Google în **Expo Go**.
2. Logare Google în **build nativ iOS/Android**.
3. Logare Google pe **web** – trebuie să continue să funcționeze.

---

# Request: add mobile OAuth redirect URLs for Google

## Context
The Rentli mobile app uses Google sign-in via direct `supabase-js`, and the redirect URLs used by the app must be in the backend allowlist.

Web Google OAuth already works. Mobile fails because `rentli://` and `exp://` schemes are not yet in the allowlist.

## Exact redirect URLs to add

Please add the following to **Auth Settings → Advanced → Redirect URLs** (or the equivalent section in Lovable Cloud), **without removing existing web redirects**:

```text
rentli://auth/callback
rentli://**
exp://**
```

## Why these are needed

- `rentli://auth/callback` – native iOS/Android production build.
- `rentli://**` – safety wildcard for other paths / deep-link variants in native builds.
- `exp://**` – Expo Go testing, where the redirect URL includes a variable IP/port (e.g. `exp://192.168.x.x:8081/--/auth/callback`).

Mobile code uses:

```ts
const redirectTo = Linking.createURL("/auth/callback");
```

which produces `rentli://auth/callback` in native builds and `exp://...` in Expo Go.

## Published domain

`rentli.ro` / `www.rentli.ro`

## Provider

Google OAuth (mobile sign-in).

## Testing after the change

1. Google sign-in in **Expo Go**.
2. Google sign-in in **native iOS/Android build**.
3. Google sign-in on **web** – must continue to work.
