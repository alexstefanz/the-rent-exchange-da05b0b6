/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  productTitle?: string
  productImage?: string
  rentalId?: string
  reason?: string
  reporterName?: string
}

const DisputeOpenedEmail = (p: Props) => {
  const cta = p.rentalId ? `${APP_URL}/rezervari?rental_id=${p.rentalId}` : `${APP_URL}/rezervari`
  return (
    <BaseLayout preview="O dispută a fost deschisă pe închirierea ta">
      <H1>⚠️ Dispută deschisă</H1>
      <Lead>
        <strong>{p.reporterName ?? 'Una dintre părți'}</strong> a deschis o dispută pentru închirierea <strong>{p.productTitle ?? 'produs'}</strong>. Echipa Rentli va analiza cazul și vă va contacta în curând.
      </Lead>
      <ProductCard image={p.productImage} title={p.productTitle} status="declined" />
      {p.reason ? <Para><strong>Motiv:</strong> {p.reason}</Para> : null}
      <CTAButton href={cta}>Vezi detaliile</CTAButton>
      <Para>Plata rămâne blocată în siguranță până la rezolvarea disputei. Nu este nevoie să acționezi în afara platformei.</Para>
    </BaseLayout>
  )
}

export const template = {
  component: DisputeOpenedEmail,
  subject: 'Dispută deschisă pentru o închiriere',
  displayName: 'Dispută deschisă',
  previewData: { productTitle: 'Drone DJI Mini', reporterName: 'Andrei P.', reason: 'Produs deteriorat' },
} satisfies TemplateEntry