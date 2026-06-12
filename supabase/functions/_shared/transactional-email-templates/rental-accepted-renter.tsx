/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  productTitle?: string
  productImage?: string
  location?: string
  ownerName?: string
  startDate?: string
  endDate?: string
  totalPrice?: number
  currency?: string
  rentalId?: string
}

const RentalAcceptedEmail = (p: Props) => {
  const period = p.startDate && p.endDate ? `${p.startDate} – ${p.endDate}` : undefined
  const cta = p.rentalId ? `${APP_URL}/rezervari?rental_id=${p.rentalId}` : `${APP_URL}/rezervari`
  return (
    <BaseLayout preview="Cererea ta a fost acceptată 🎉">
      <H1>🎉 Cererea ta a fost acceptată!</H1>
      <Lead>
        <strong>{p.ownerName ?? 'Proprietarul'}</strong> a confirmat rezervarea.
        Pentru a finaliza rezervarea, <strong>plătește acum</strong> prin Stripe — suma va fi
        blocată în siguranță până la predare.
      </Lead>
      <ProductCard
        image={p.productImage}
        title={p.productTitle}
        location={p.location}
        period={period}
        totalPrice={p.totalPrice}
        currency={p.currency}
        status="approved"
      />
      <CTAButton href={cta}>Plătește acum</CTAButton>
      <Para>După plată, vei putea discuta cu proprietarul direct din chat-ul Rentli pentru a stabili ridicarea.</Para>
    </BaseLayout>
  )
}

export const template = {
  component: RentalAcceptedEmail,
  subject: 'Cererea ta de închiriere a fost acceptată! 🎉',
  displayName: 'Cerere acceptată',
  previewData: {
    productTitle: 'Bicicletă Mountain Bike Trek',
    productImage: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
    location: 'București, Sector 1',
    ownerName: 'Maria Ionescu',
    startDate: '15 ian 2026',
    endDate: '18 ian 2026',
    totalPrice: 240,
    currency: 'RON',
    rentalId: 'abc-123',
  },
} satisfies TemplateEntry
