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
    <BaseLayout preview={`${p.renterName ?? 'Un utilizator'} a plătit pentru ${productLabel} — începe chatul`}>
      <H1>Plată primită — începe chatul</H1>
      <Lead>
        <strong>{p.renterName ?? 'Un utilizator'}</strong> a făcut plata pentru închirierea produsului
        „{productLabel}". Începeți discuția pe chat.
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
      <CTAButton href={cta}>Deschide chatul</CTAButton>
      <Para>
        După ce ați stabilit data și ora predării produsului, completați procesele verbale.
      </Para>
      <Para>
        Este nevoie de câteva poze înainte din partea ambelor părți pentru a ne asigura că produsul
        se predă și se întoarce la fel.
      </Para>
    </BaseLayout>
  )
}

export const template = {
  component: RentalRequestOwnerEmail,
  subject: 'Plată primită — începe chatul cu chiriașul',
  displayName: 'Plată primită (Owner)',
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
