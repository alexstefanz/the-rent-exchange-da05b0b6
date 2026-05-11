/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  productTitle?: string
  productImage?: string
  rentalId?: string
  startDate?: string
  endDate?: string
}

const HandoverConfirmedEmail = (p: Props) => {
  const cta = p.rentalId ? `${APP_URL}/rezervari?rental_id=${p.rentalId}` : `${APP_URL}/rezervari`
  return (
    <BaseLayout preview="Predarea a fost confirmată — închirierea e activă">
      <H1>🎉 Predarea a fost confirmată</H1>
      <Lead>
        Procesul verbal de predare pentru <strong>{p.productTitle ?? 'produs'}</strong> a fost completat cu succes de ambele părți. Închirierea este acum <strong>activă</strong>.
      </Lead>
      <ProductCard image={p.productImage} title={p.productTitle} status="active" />
      <Para>Perioadă: <strong>{p.startDate} — {p.endDate}</strong></Para>
      <CTAButton href={cta}>Vezi detalii închiriere</CTAButton>
    </BaseLayout>
  )
}

export const template = {
  component: HandoverConfirmedEmail,
  subject: 'Predarea a fost confirmată',
  displayName: 'Predare confirmată',
  previewData: { productTitle: 'Drone DJI Mini', startDate: '15 mai', endDate: '20 mai' },
} satisfies TemplateEntry