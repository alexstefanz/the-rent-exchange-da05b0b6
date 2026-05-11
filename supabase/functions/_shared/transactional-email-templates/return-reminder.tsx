/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  productTitle?: string
  productImage?: string
  rentalId?: string
  endDate?: string
}

const ReturnReminderEmail = (p: Props) => {
  const cta = p.rentalId ? `${APP_URL}/rezervari?rental_id=${p.rentalId}` : `${APP_URL}/rezervari`
  return (
    <BaseLayout preview="Reminder: returnarea se apropie">
      <H1>⏰ Returnarea se apropie</H1>
      <Lead>
        Reaminim că închirierea pentru <strong>{p.productTitle ?? 'produs'}</strong> se încheie pe <strong>{p.endDate}</strong>. Pregătește produsul și stabilește detaliile returnării cu cealaltă parte din chat.
      </Lead>
      <ProductCard image={p.productImage} title={p.productTitle} status="active" />
      <CTAButton href={cta}>Vezi detalii închiriere</CTAButton>
      <Para>În ziua returnării vei completa procesul verbal final.</Para>
    </BaseLayout>
  )
}

export const template = {
  component: ReturnReminderEmail,
  subject: 'Reminder: returnarea se apropie',
  displayName: 'Reminder returnare',
  previewData: { productTitle: 'Drone DJI Mini', endDate: '20 mai' },
} satisfies TemplateEntry