/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  productTitle?: string
  productImage?: string
  location?: string
  renterName?: string
  startDate?: string
  endDate?: string
  ownerPayout?: number
  totalPaid?: number
  currency?: string
  rentalId?: string
}

const RentalAcceptedOwnerEmail = (p: Props) => {
  const period = p.startDate && p.endDate ? `${p.startDate} – ${p.endDate}` : undefined
  const cta = p.rentalId ? `${APP_URL}/rezervari?rental_id=${p.rentalId}` : `${APP_URL}/rezervari`
  const total = p.ownerPayout ?? p.totalPaid
  return (
    <BaseLayout preview="Ai acceptat o cerere de închiriere">
      <H1>✅ Ai acceptat cererea</H1>
      <Lead>
        Ai confirmat rezervarea pentru <strong>{p.renterName ?? 'chiriaș'}</strong> la <strong>{p.productTitle ?? 'produsul tău'}</strong>. Pregătește produsul pentru predare.
      </Lead>
      <ProductCard
        image={p.productImage}
        title={p.productTitle}
        location={p.location}
        period={period}
        totalPrice={total}
        currency={p.currency}
        status="approved"
      />
      <CTAButton href={cta}>Vezi rezervarea</CTAButton>
      <Para>Discută cu chiriașul direct din chat-ul Rentli pentru a stabili detaliile predării.</Para>
    </BaseLayout>
  )
}

export const template = {
  component: RentalAcceptedOwnerEmail,
  subject: 'Ai acceptat o cerere de închiriere ✓',
  displayName: 'Cerere acceptată (proprietar)',
  previewData: {
    productTitle: 'Bicicletă Mountain Bike Trek',
    productImage: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
    location: 'București, Sector 1',
    renterName: 'Ion Popescu',
    startDate: '15 ian 2026',
    endDate: '18 ian 2026',
    ownerPayout: 228,
    currency: 'RON',
    rentalId: 'abc-123',
  },
} satisfies TemplateEntry