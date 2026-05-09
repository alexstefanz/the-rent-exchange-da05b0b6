/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, ReasonBox, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  renterName?: string
  productTitle?: string
  productImage?: string
  location?: string
  startDate?: string
  endDate?: string
  reason?: string
}

const CancellationOwnerEmail = (p: Props) => {
  const period = p.startDate && p.endDate ? `${p.startDate} – ${p.endDate}` : undefined
  return (
    <BaseLayout preview="O cerere de închiriere a fost anulată">
      <H1>Cerere anulată</H1>
      <Lead>
        <strong>{p.renterName ?? 'Chiriașul'}</strong> a anulat cererea pentru produsul tău.
        Acesta este din nou disponibil pentru alte rezervări.
      </Lead>
      <ProductCard image={p.productImage} title={p.productTitle} location={p.location} period={period} status="cancelled" />
      {p.reason && <ReasonBox label="Motivul anulării">{p.reason}</ReasonBox>}
      <CTAButton href={`${APP_URL}/profile`}>Gestionează produsele</CTAButton>
    </BaseLayout>
  )
}

export const template = {
  component: CancellationOwnerEmail,
  subject: 'O cerere de închiriere a fost anulată',
  displayName: 'Anulare (Owner)',
  previewData: {
    renterName: 'Ion Popescu',
    productTitle: 'Bicicletă Mountain Bike Trek',
    productImage: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
    location: 'București, Sector 1',
    startDate: '15 ian 2026',
    endDate: '18 ian 2026',
    reason: 'Am găsit altceva',
  },
} satisfies TemplateEntry
