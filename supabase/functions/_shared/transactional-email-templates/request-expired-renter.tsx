/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  ownerName?: string
  productTitle?: string
  productImage?: string
  startDate?: string
  endDate?: string
  currency?: string
}

const RequestExpiredRenterEmail = (p: Props) => {
  const period = p.startDate && p.endDate ? `${p.startDate} – ${p.endDate}` : undefined
  return (
    <BaseLayout preview={`Cererea pentru ${p.productTitle ?? 'produsul ales'} a expirat`}>
      <H1>Cerere expirată fără răspuns</H1>
      <Lead>
        Cererea ta pentru „{p.productTitle ?? 'produsul ales'}" a fost <strong>anulată automat</strong>{' '}
        pentru că proprietarul <strong>{p.ownerName ?? ''}</strong> nu a răspuns în 24 de ore.
        <strong>Nu ai fost taxat</strong> — nicio sumă nu a fost retrasă.
      </Lead>
      <ProductCard
        image={p.productImage}
        title={p.productTitle}
        period={period}
        currency={p.currency}
        status="cancelled"
      />
      <CTAButton href={`${APP_URL}/cauta`}>Caută alte produse similare</CTAButton>
      <Para>
        Îți recomandăm să trimiți cereri către mai mulți proprietari deodată pentru a crește
        șansele de a primi un răspuns rapid.
      </Para>
    </BaseLayout>
  )
}

export const template = {
  component: RequestExpiredRenterEmail,
  subject: 'Cererea ta a expirat — nu ai fost taxat',
  displayName: 'Cerere expirată (Renter)',
  previewData: {
    ownerName: 'Maria Ionescu',
    productTitle: 'Bicicletă Mountain Bike Trek',
    productImage: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
    startDate: '15 ian 2026',
    endDate: '18 ian 2026',
    currency: 'RON',
  },
} satisfies TemplateEntry