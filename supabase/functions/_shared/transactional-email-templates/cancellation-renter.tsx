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
  ownerName?: string
  cancelledBy?: 'owner' | 'renter' | 'admin'
  isPaid?: boolean
}

const CancellationRenterEmail = (p: Props) => {
  const period = p.startDate && p.endDate ? `${p.startDate} – ${p.endDate}` : undefined
  const byOwner = p.cancelledBy === 'owner'
  const paid = p.isPaid === true
  return (
    <BaseLayout preview={byOwner ? 'Proprietarul a anulat cererea de închiriere' : 'Cererea ta de închiriere a fost anulată'}>
      <H1>{byOwner ? 'Cererea a fost anulată de proprietar' : 'Cerere anulată'}</H1>
      <Lead>
        {byOwner ? (
          <><strong>{p.ownerName ?? 'Proprietarul'}</strong> a anulat cererea ta de închiriere{p.productTitle ? <> pentru <strong>{p.productTitle}</strong></> : null}.</>
        ) : (
          <>Cererea ta de închiriere a fost anulată.</>
        )}
      </Lead>
      <ProductCard image={p.productImage} title={p.productTitle} location={p.location} period={period} status="cancelled" />
      {paid ? (
        <Para>Suma reținută a fost eliberată automat în metoda ta de plată. Poate apărea în extras în 3-7 zile lucrătoare, în funcție de banca ta.</Para>
      ) : (
        <Para>Nu ai fost taxat. Nicio sumă nu a fost retrasă de pe metoda ta de plată.</Para>
      )}
      <CTAButton href={`${APP_URL}/cauta`}>Explorează alte produse</CTAButton>
    </BaseLayout>
  )
}

export const template = {
  component: CancellationRenterEmail,
  subject: (d: Record<string, any>) =>
    d?.cancelledBy === 'owner' ? 'Proprietarul a anulat cererea de închiriere' : 'Cererea ta de închiriere a fost anulată',
  displayName: 'Anulare (Renter)',
  previewData: {
    productTitle: 'Bicicletă Mountain Bike Trek',
    productImage: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
    location: 'București, Sector 1',
    startDate: '15 ian 2026',
    endDate: '18 ian 2026',
    ownerName: 'Rentli Office',
    cancelledBy: 'owner',
    isPaid: false,
  },
} satisfies TemplateEntry
