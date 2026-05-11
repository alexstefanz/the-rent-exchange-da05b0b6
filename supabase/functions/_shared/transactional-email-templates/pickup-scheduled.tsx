/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, InfoRow, APP_URL } from './_components.tsx'

interface Props {
  productTitle?: string
  productImage?: string
  pickupDate?: string
  pickupTime?: string
  pickupLocation?: string
  contactName?: string
  rentalId?: string
  isOwner?: boolean
}

const PickupScheduledEmail = (p: Props) => {
  const cta = p.rentalId ? `${APP_URL}/rezervari?rental_id=${p.rentalId}` : `${APP_URL}/rezervari`
  return (
    <BaseLayout preview="Predarea a fost stabilită">
      <H1>📅 Predarea a fost stabilită</H1>
      <Lead>
        Ai stabilit împreună cu <strong>{p.contactName ?? 'cealaltă parte'}</strong> momentul predării pentru <strong>{p.productTitle ?? 'produs'}</strong>.
      </Lead>
      <ProductCard image={p.productImage} title={p.productTitle} status="approved" />
      <InfoRow label="Data" value={p.pickupDate ?? '—'} />
      <InfoRow label="Ora" value={p.pickupTime ?? '—'} />
      <InfoRow label="Loc întâlnire" value={p.pickupLocation ?? '—'} />
      <InfoRow label="Persoană contact" value={p.contactName ?? '—'} />
      <CTAButton href={cta}>Vezi detalii predare</CTAButton>
      <Para>
        ⚠️ La întâlnire, <strong>ambele părți trebuie să completeze procesul verbal digital</strong> (poze + checklist) pentru ca produsul să fie predat.
      </Para>
    </BaseLayout>
  )
}

export const template = {
  component: PickupScheduledEmail,
  subject: 'Predarea a fost stabilită – pregătește procesul verbal',
  displayName: 'Predare stabilită',
  previewData: { productTitle: 'Cort 4 persoane', pickupDate: '15 ian 2026', pickupTime: '10:00', pickupLocation: 'București, Sector 1', contactName: 'Maria' },
} satisfies TemplateEntry