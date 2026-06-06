/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  productTitle?: string
  productImage?: string
  rentalId?: string
  ownerPayout?: number
  currency?: string
  renterName?: string
  pvPdfUrl?: string
}

const RentalCompletedOwnerEmail = (p: Props) => {
  const cta = `${APP_URL}/balanta`
  const reviewCta = p.rentalId ? `${APP_URL}/rezervari?rental_id=${p.rentalId}&review=1` : `${APP_URL}/rezervari`
  return (
    <BaseLayout preview="Închirierea a fost finalizată cu succes">
      <H1>🎉 Închiriere finalizată</H1>
      <Lead>
        Închirierea pentru <strong>{p.productTitle ?? 'produs'}</strong> a fost finalizată cu succes. Suma de <strong>{p.ownerPayout ?? 0} {p.currency ?? 'RON'}</strong> a fost adăugată la balanța ta și va fi disponibilă pentru retragere conform termenilor.
      </Lead>
      <ProductCard image={p.productImage} title={p.productTitle} status="completed" />
      {p.pvPdfUrl ? (
        <>
          <Para>Procesul verbal de returnare este atașat acestui email și poate fi descărcat și de aici (valabil 7 zile):</Para>
          <CTAButton href={p.pvPdfUrl} variant="ghost">Descarcă PV (PDF)</CTAButton>
        </>
      ) : null}
      <CTAButton href={cta}>Vezi balanța</CTAButton>
      <Para>Te rugăm să lași un review pentru <strong>{p.renterName ?? 'chiriaș'}</strong> ca să întărești comunitatea Rentli.</Para>
      <CTAButton href={reviewCta}>Lasă un review</CTAButton>
    </BaseLayout>
  )
}

export const template = {
  component: RentalCompletedOwnerEmail,
  subject: 'Închirierea ta a fost finalizată',
  displayName: 'Finalizare (proprietar)',
  previewData: { productTitle: 'Drone DJI Mini', ownerPayout: 285, currency: 'RON', renterName: 'Andrei P.' },
} satisfies TemplateEntry