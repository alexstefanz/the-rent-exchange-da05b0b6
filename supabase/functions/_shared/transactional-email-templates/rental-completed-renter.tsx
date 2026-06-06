/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  productTitle?: string
  productImage?: string
  rentalId?: string
  totalPaid?: number
  currency?: string
  ownerName?: string
  pvPdfUrl?: string
}

const RentalCompletedRenterEmail = (p: Props) => {
  const reviewCta = p.rentalId ? `${APP_URL}/rezervari?rental_id=${p.rentalId}&review=1` : `${APP_URL}/rezervari`
  return (
    <BaseLayout preview="Închirierea a fost finalizată — mulțumim!">
      <H1>✅ Închiriere finalizată</H1>
      <Lead>
        Închirierea pentru <strong>{p.productTitle ?? 'produs'}</strong> a fost finalizată cu succes. Mulțumim că folosești Rentli!
      </Lead>
      <ProductCard image={p.productImage} title={p.productTitle} status="completed" />
      <Para>Total plătit: <strong>{p.totalPaid ?? 0} {p.currency ?? 'RON'}</strong></Para>
      {p.pvPdfUrl ? (
        <>
          <Para>Procesul verbal de returnare este atașat acestui email și poate fi descărcat și de aici (valabil 7 zile):</Para>
          <CTAButton href={p.pvPdfUrl} variant="ghost">Descarcă PV (PDF)</CTAButton>
        </>
      ) : null}
      <Para>Lasă un review pentru <strong>{p.ownerName ?? 'proprietar'}</strong> și ajută alți utilizatori să aleagă în siguranță.</Para>
      <CTAButton href={reviewCta}>Lasă un review</CTAButton>
    </BaseLayout>
  )
}

export const template = {
  component: RentalCompletedRenterEmail,
  subject: 'Închirierea ta a fost finalizată',
  displayName: 'Finalizare (chiriaș)',
  previewData: { productTitle: 'Drone DJI Mini', totalPaid: 300, currency: 'RON', ownerName: 'Maria I.' },
} satisfies TemplateEntry