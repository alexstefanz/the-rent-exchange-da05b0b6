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
}

const CancellationRenterEmail = (p: Props) => {
  const period = p.startDate && p.endDate ? `${p.startDate} – ${p.endDate}` : undefined
  return (
    <BaseLayout preview="Cererea ta de închiriere a fost anulată">
      <H1>Cerere anulată</H1>
      <Lead>
        Cererea ta de închiriere a fost anulată cu succes. Eventuala sumă reținută în escrow
        a fost returnată automat în metoda ta de plată.
      </Lead>
      <ProductCard image={p.productImage} title={p.productTitle} location={p.location} period={period} status="cancelled" />
      <CTAButton href={`${APP_URL}/cauta`}>Explorează alte produse</CTAButton>
      <Para>Returnarea poate apărea în extras în 3-7 zile lucrătoare, în funcție de banca ta.</Para>
    </BaseLayout>
  )
}

export const template = {
  component: CancellationRenterEmail,
  subject: 'Cererea ta de închiriere a fost anulată',
  displayName: 'Anulare (Renter)',
  previewData: {
    productTitle: 'Bicicletă Mountain Bike Trek',
    productImage: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
    location: 'București, Sector 1',
    startDate: '15 ian 2026',
    endDate: '18 ian 2026',
  },
} satisfies TemplateEntry
