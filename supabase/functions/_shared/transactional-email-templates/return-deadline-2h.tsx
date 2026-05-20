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

const ReturnDeadline2hEmail = (p: Props) => {
  const cta = p.rentalId ? `${APP_URL}/rezervari?rental_id=${p.rentalId}` : `${APP_URL}/rezervari`
  return (
    <BaseLayout preview="⏰ Mai sunt 2 ore până la deadline-ul de returnare">
      <H1>⏰ Mai sunt 2 ore până la deadline</H1>
      <Lead>
        Închirierea pentru <strong>{p.productTitle ?? 'produs'}</strong> se încheie la <strong>miezul nopții</strong>. Te rugăm să finalizezi returnarea în următoarele 2 ore pentru a evita penalizările și întârzierile.
      </Lead>
      <ProductCard image={p.productImage} title={p.productTitle} status="active" />
      <CTAButton href={cta}>Finalizează returnarea</CTAButton>
      <Para>Nu uita să completezi procesul verbal de returnare împreună cu cealaltă parte.</Para>
    </BaseLayout>
  )
}

export const template = {
  component: ReturnDeadline2hEmail,
  subject: '⏰ Deadline returnare în 2 ore',
  displayName: 'Deadline returnare 2h',
  previewData: { productTitle: 'Drone DJI Mini', endDate: '20 mai' },
} satisfies TemplateEntry