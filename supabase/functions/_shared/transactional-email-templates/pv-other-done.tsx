/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  productTitle?: string
  productImage?: string
  rentalId?: string
  otherPartyName?: string
  phase?: 'pickup' | 'return'
}

const PvOtherDoneEmail = (p: Props) => {
  const isReturn = p.phase === 'return'
  const cta = p.rentalId ? `${APP_URL}/rezervari?rental_id=${p.rentalId}&pv=1` : `${APP_URL}/rezervari`
  return (
    <BaseLayout preview={`${p.otherPartyName ?? 'Cealaltă parte'} a completat PV-ul`}>
      <H1>✅ PV {isReturn ? 'de returnare' : 'de predare'} completat parțial</H1>
      <Lead>
        <strong>{p.otherPartyName ?? 'Cealaltă parte'}</strong> a completat partea sa din procesul verbal pentru <strong>{p.productTitle ?? 'produs'}</strong>. E rândul tău să completezi PV-ul pentru a continua.
      </Lead>
      <ProductCard image={p.productImage} title={p.productTitle} status="pending" />
      <CTAButton href={cta}>Completează PV-ul tău</CTAButton>
      <Para>Ai nevoie de minim 3 poze și să bifezi checklist-ul.</Para>
    </BaseLayout>
  )
}

export const template = {
  component: PvOtherDoneEmail,
  subject: 'Acțiune necesară: completează partea ta din PV',
  displayName: 'PV completat de cealaltă parte',
  previewData: { productTitle: 'Drone DJI Mini', otherPartyName: 'Andrei Popescu', phase: 'pickup' },
} satisfies TemplateEntry