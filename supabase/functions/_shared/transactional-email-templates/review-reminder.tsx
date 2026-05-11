/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  productTitle?: string
  productImage?: string
  rentalId?: string
  otherPartyName?: string
}

const ReviewReminderEmail = (p: Props) => {
  const cta = p.rentalId ? `${APP_URL}/rezervari?rental_id=${p.rentalId}&review=1` : `${APP_URL}/rezervari`
  return (
    <BaseLayout preview="Lasă un review pentru închirierea ta">
      <H1>⭐ Lasă un review</H1>
      <Lead>
        Cum a fost experiența ta cu <strong>{p.productTitle ?? 'produs'}</strong>{p.otherPartyName ? ` și ${p.otherPartyName}` : ''}? Review-urile cresc încrederea în comunitate și te ajută să primești tu însuți mai multe rezervări.
      </Lead>
      <ProductCard image={p.productImage} title={p.productTitle} status="completed" />
      <CTAButton href={cta}>Lasă un review</CTAButton>
      <Para>Durează mai puțin de un minut.</Para>
    </BaseLayout>
  )
}

export const template = {
  component: ReviewReminderEmail,
  subject: 'Lasă un review pentru închirierea ta',
  displayName: 'Reminder review',
  previewData: { productTitle: 'Drone DJI Mini', otherPartyName: 'Andrei P.' },
} satisfies TemplateEntry