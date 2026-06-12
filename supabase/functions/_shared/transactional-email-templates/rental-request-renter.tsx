/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  productTitle?: string
  productImage?: string
  location?: string
  startDate?: string
  endDate?: string
  totalPrice?: number
  currency?: string
  rentalId?: string
}

const RentalRequestRenterEmail = (p: Props) => {
  const period = p.startDate && p.endDate ? `${p.startDate} – ${p.endDate}` : undefined
  const cta = p.rentalId ? `${APP_URL}/cereri?rental_id=${p.rentalId}` : `${APP_URL}/cereri`
  return (
    <BaseLayout preview="Cererea ta a fost trimisă proprietarului">
      <H1>Cerere trimisă cu succes ✓</H1>
      <Lead>
        Cererea ta a fost trimisă proprietarului. <strong>Cardul tău nu a fost debitat.</strong>{' '}
        Imediat ce proprietarul acceptă, primești un link de plată securizată Stripe, iar suma
        va fi blocată în custodie până la predare.
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
      <CTAButton href={cta}>Vezi statusul cererii</CTAButton>
      <Para>După plată, suma este reținută în custodie și eliberată proprietarului doar după finalizarea închirierii.</Para>
    </BaseLayout>
  )
}

export const template = {
  component: RentalRequestRenterEmail,
  subject: 'Cererea ta de închiriere a fost trimisă',
  displayName: 'Cerere trimisă (Renter)',
  previewData: {
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
