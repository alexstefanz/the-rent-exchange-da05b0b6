

# Modernizare Template Email + Adresă Expeditor

## 1. Adresa de email (onboarding@resend.dev)

**Da, se poate schimba**, dar necesita un pas in afara platformei:
- Adresa `onboarding@resend.dev` este adresa implicita de test oferita de Resend
- Pentru a folosi o adresa proprie (ex: `noreply@rentnow.ro`), trebuie sa:
  1. Accesezi contul Resend si sa adaugi un domeniu propriu (ex: `rentnow.ro`)
  2. Configurezi inregistrarile DNS (SPF, DKIM) conform instructiunilor Resend
  3. Dupa verificare, actualizezi adresa `from` in cod

**Fara un domeniu verificat**, Resend nu permite trimiterea de pe alte adrese. Acesta este un pas pe care trebuie sa-l faci tu in panoul Resend. Odata ce ai domeniul verificat, imi spui adresa dorita si o actualizez in cod.

## 2. Template Email Modern

**Da, se poate!** Voi inlocui HTML-ul simplu cu un template modern, responsive, in culorile platformei (verde primary `hsl(131, 45%, 50%)` si fundal cald).

### Ce se va schimba

Ambele edge functions (`send-rental-notification` si `respond-rental-request`) vor primi un template HTML complet cu:

- **Header** cu logo/nume "RentNow" pe fundal verde primary
- **Card central** cu fundal alb, border-radius, si shadow subtil
- **Informatii structurate** cu iconite text si separatori
- **Buton CTA** verde cu link catre platforma (ex: "Vezi cererea", "Raspunde acum", "Cauta produse")
- **Footer** cu text gri si link catre platforma
- **Responsive** -- arata bine pe desktop si mobil

### Template-uri afectate (4 emailuri total)

| Email | Destinatar | Buton CTA |
|-------|-----------|-----------|
| Cerere noua de inchiriere | Proprietar | "Vezi cererea" -> `/profile?tab=lendings` |
| Cerere trimisa | Chirias | "Vezi statusul" -> `/profile?tab=cereri` |
| Cerere acceptata | Chirias | "Discuta detaliile" -> `/profile?tab=rentals` |
| Cerere refuzata | Chirias | "Cauta produse" -> `/cauta` |

### Detalii tehnice

**Fisiere modificate:**
- `supabase/functions/send-rental-notification/index.ts` -- template nou pentru emailurile de cerere noua + confirmare trimitere
- `supabase/functions/respond-rental-request/index.ts` -- template nou pentru emailurile de acceptare + refuzare

**Abordare:** Voi crea o functie helper `buildEmailTemplate()` in fiecare edge function care genereaza HTML-ul complet cu parametri (titlu, continut, buton text, buton link). Astfel template-ul ramane consistent si usor de modificat.

**Culorile folosite:**
- Primary (verde): `#3DB86A` (din HSL 131, 45%, 50%)
- Background: `#FAF9F7` (fundal cald)
- Card: `#FFFFFF`
- Text principal: `#2D2517`
- Text secundar: `#6B6155`

