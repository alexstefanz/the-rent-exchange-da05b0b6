/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  renterName?: string
  productTitle?: string
  productImage?: string
  location?: string
  startDate?: string
  endDate?: string
  totalPrice?: number
  currency?: string
  rentalId?: string
}

const RentalRequestOwnerEmail = (p: Props) => {
  const period = p.startDate && p.endDate ? `${p.startDate} – ${p.endDate}` : undefined
  const cta = p.rentalId ? `${APP_URL}/inchirieri?rental_id=${p.rentalId}` : `${APP_URL}/inchirieri`
  const productLabel = p.productTitle ?? 'produsul tău'
  return (
    <BaseLayout preview={`${p.renterName ?? 'Un utilizator'} dorește să închirieze ${productLabel}`}>
      <H1>Cerere nouă de închiriere</H1>
      <Lead>
        <strong>{p.renterName ?? 'Un utilizator'}</strong> dorește să închirieze produsul
        „{productLabel}". <strong>Nu se face nicio încasare în acest moment.</strong> Dacă
        acceptați cererea, chiriașul va primi un link de plată securizată Stripe, iar suma
        va fi blocată în custodie până la finalizarea închirierii.
      </Lead>
      <ProductCard
        image={p.productImage}
        title={p.productTitle}
        location={p.location}
        period={period}
        totalPrice={p.totalPrice}
        currency={p.currency}
        status="pending"
      />
      <CTAButton href={cta}>Vezi cererea</CTAButton>
      <Para>
        Acceptați sau refuzați cererea cât mai repede. După acceptare, chiriașul are la
        dispoziție un link de plată securizată Stripe; imediat ce plata este efectuată, puteți
        discuta pe chat pentru a stabili data și ora predării.
      </Para>
      <Para>
        La predare și la returnare este obligatoriu să completați procesele verbale cu poze, ca să ne
        asigurăm că produsul se predă și se întoarce în aceeași stare.
      </Para>
    </BaseLayout>
  )
}

export const template = {
  component: RentalRequestOwnerEmail,
  subject: 'Cerere nouă de închiriere',
  displayName: 'Cerere nouă (Owner)',
  previewData: {
    renterName: 'Ion Popescu',
    productTitle: 'Bicicletă Mountain Bike Trek',
    productImage: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
    location: 'București, Sector 1',
    startDate: '15 ian 2026',
    endDate: '18 ian 2026',
    totalPrice: 240,
    currency: 'RON',
    rentalId: '326efd56-9af7-4af2-a57c-b0cdea56e5dd',
  },
} satisfies TemplateEntry
