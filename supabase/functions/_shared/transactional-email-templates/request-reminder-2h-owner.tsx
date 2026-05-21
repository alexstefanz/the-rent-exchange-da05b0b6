/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  renterName?: string
  productTitle?: string
  productImage?: string
  startDate?: string
  endDate?: string
  totalPrice?: number
  currency?: string
  rentalId?: string
}

const RequestReminder2hOwnerEmail = (p: Props) => {
  const period = p.startDate && p.endDate ? `${p.startDate} – ${p.endDate}` : undefined
  const cta = p.rentalId ? `${APP_URL}/inchirieri?rental_id=${p.rentalId}` : `${APP_URL}/inchirieri`
  const productLabel = p.productTitle ?? 'produsul tău'
  return (
    <BaseLayout preview={`Mai ai 2 ore să răspunzi la cererea pentru ${productLabel}`}>
      <H1>⏰ Mai ai 2 ore să răspunzi</H1>
      <Lead>
        <strong>{p.renterName ?? 'Un utilizator'}</strong> așteaptă răspunsul tău pentru cererea de
        închiriere „{productLabel}". Mai ai aproximativ <strong>2 ore</strong> să accepți sau să
        refuzi — după care cererea va fi <strong>anulată automat</strong> iar hold-ul de pe cardul
        chiriașului va fi eliberat.
      </Lead>
      <ProductCard
        image={p.productImage}
        title={p.productTitle}
        period={period}
        totalPrice={p.totalPrice}
        currency={p.currency}
        status="pending"
      />
      <CTAButton href={cta}>Acceptă sau refuză acum</CTAButton>
      <Para>
        Răspunsurile rapide cresc rata de acceptare și încrederea chiriașilor în profilul tău.
      </Para>
    </BaseLayout>
  )
}

export const template = {
  component: RequestReminder2hOwnerEmail,
  subject: '⏰ Mai ai 2 ore să răspunzi la cerere',
  displayName: 'Reminder 2h cerere (Owner)',
  previewData: {
    renterName: 'Ion Popescu',
    productTitle: 'Bicicletă Mountain Bike Trek',
    productImage: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
    startDate: '15 ian 2026',
    endDate: '18 ian 2026',
    totalPrice: 240,
    currency: 'RON',
    rentalId: '326efd56-9af7-4af2-a57c-b0cdea56e5dd',
  },
} satisfies TemplateEntry