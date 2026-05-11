/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  productTitle?: string
  productImage?: string
  rentalId?: string
}

const ReturnInProgressEmail = (p: Props) => {
  const cta = p.rentalId ? `${APP_URL}/rezervari?rental_id=${p.rentalId}&pv=1` : `${APP_URL}/rezervari`
  return (
    <BaseLayout preview="Returnare în curs — completează PV-ul de returnare">
      <H1>📦 Returnarea este în curs</H1>
      <Lead>
        Închirierea pentru <strong>{p.productTitle ?? 'produs'}</strong> a intrat în faza de returnare. Ambele părți trebuie să completeze procesul verbal de returnare (minim 3 poze + checklist).
      </Lead>
      <ProductCard image={p.productImage} title={p.productTitle} status="pending" />
      <CTAButton href={cta}>Completează PV-ul de returnare</CTAButton>
      <Para>Fără PV completat, închirierea nu poate fi finalizată și plata nu este eliberată.</Para>
    </BaseLayout>
  )
}

export const template = {
  component: ReturnInProgressEmail,
  subject: 'Acțiune necesară: PV de returnare',
  displayName: 'Returnare în curs',
  previewData: { productTitle: 'Drone DJI Mini' },
} satisfies TemplateEntry