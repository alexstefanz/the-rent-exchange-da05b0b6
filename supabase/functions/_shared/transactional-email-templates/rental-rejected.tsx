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
  isPaid?: boolean
}

const RentalRejectedEmail = (p: Props) => {
  const period = p.startDate && p.endDate ? `${p.startDate} – ${p.endDate}` : undefined
  return (
    <BaseLayout preview="Cererea ta a fost refuzată">
      <H1>Cerere refuzată</H1>
      <Lead>
        Din păcate, <strong>{p.ownerName ?? 'proprietarul'}</strong> nu a putut accepta cererea ta.
      </Lead>
      <Para>
        {p.isPaid
          ? 'Suma plătită a fost returnată automat în metoda ta de plată. Poate apărea în extras în 3-7 zile lucrătoare, în funcție de banca ta.'
          : 'Nu ai fost taxat. Nicio sumă nu a fost retrasă de pe metoda ta de plată.'}
      </Para>
      <ProductCard
        image={p.productImage}
        title={p.productTitle}
        location={p.location}
        period={period}
        totalPrice={p.totalPrice}
        currency={p.currency}
        status="declined"
      />
      <CTAButton href={`${APP_URL}/cauta`} variant="primary">Caută alternative</CTAButton>
      <Para>Sunt mii de produse similare disponibile pe platformă.</Para>
    </BaseLayout>
  )
}

export const template = {
  component: RentalRejectedEmail,
  subject: 'Cererea ta de închiriere a fost refuzată',
  displayName: 'Cerere refuzată',
  previewData: {
    productTitle: 'Bicicletă Mountain Bike Trek',
    productImage: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
    location: 'București, Sector 1',
    ownerName: 'Maria Ionescu',
    startDate: '15 ian 2026',
    endDate: '18 ian 2026',
    totalPrice: 240,
    currency: 'RON',
  },
} satisfies TemplateEntry
