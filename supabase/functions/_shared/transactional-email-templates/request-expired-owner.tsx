/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, APP_URL } from './_components.tsx'

interface Props {
  renterName?: string
  productTitle?: string
  productImage?: string
  startDate?: string
  endDate?: string
  currency?: string
}

const RequestExpiredOwnerEmail = (p: Props) => {
  const period = p.startDate && p.endDate ? `${p.startDate} – ${p.endDate}` : undefined
  return (
    <BaseLayout preview={`Cererea pentru ${p.productTitle ?? 'produsul tău'} a expirat`}>
      <H1>Cerere expirată automat</H1>
      <Lead>
        Cererea de la <strong>{p.renterName ?? 'un utilizator'}</strong> pentru
        „{p.productTitle ?? 'produsul tău'}" a fost <strong>anulată automat</strong> deoarece nu
        a primit răspuns în 24 de ore.
      </Lead>
      <ProductCard
        image={p.productImage}
        title={p.productTitle}
        period={period}
        currency={p.currency}
        status="cancelled"
      />
      <Para>
        Răspunsurile rapide la cereri îți cresc reputația și șansele să fii ales de viitorii
        chiriași. Activează notificările push pentru a nu mai rata cereri.
      </Para>
    </BaseLayout>
  )
}

export const template = {
  component: RequestExpiredOwnerEmail,
  subject: 'Cerere expirată automat (24h fără răspuns)',
  displayName: 'Cerere expirată (Owner)',
  previewData: {
    renterName: 'Ion Popescu',
    productTitle: 'Bicicletă Mountain Bike Trek',
    productImage: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
    startDate: '15 ian 2026',
    endDate: '18 ian 2026',
    currency: 'RON',
  },
} satisfies TemplateEntry