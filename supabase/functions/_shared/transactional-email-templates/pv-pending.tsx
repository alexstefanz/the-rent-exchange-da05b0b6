/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  productTitle?: string
  productImage?: string
  rentalId?: string
  phase?: 'pickup' | 'return'
}

const PvPendingEmail = (p: Props) => {
  const isReturn = p.phase === 'return'
  const cta = p.rentalId ? `${APP_URL}/rezervari?rental_id=${p.rentalId}&pv=1` : `${APP_URL}/rezervari`
  return (
    <BaseLayout preview={isReturn ? 'Procesul verbal de returnare' : 'Procesul verbal de predare'}>
      <H1>📝 Procesul verbal {isReturn ? 'de returnare' : 'de predare'}</H1>
      <Lead>
        Procesul verbal pentru <strong>{p.productTitle ?? 'produs'}</strong> trebuie completat de ambele părți (minim 3 poze + checklist) înainte ca {isReturn ? 'returnarea să fie confirmată' : 'produsul să intre în folosire'}.
      </Lead>
      <ProductCard image={p.productImage} title={p.productTitle} status="pending" />
      <CTAButton href={cta}>Completează procesul verbal</CTAButton>
      <Para>Fără PV completat, închirierea nu poate avansa la pasul următor.</Para>
    </BaseLayout>
  )
}

export const template = {
  component: PvPendingEmail,
  subject: 'Acțiune necesară: completează procesul verbal',
  displayName: 'PV de completat',
  previewData: { productTitle: 'Drone DJI Mini', phase: 'pickup' },
} satisfies TemplateEntry