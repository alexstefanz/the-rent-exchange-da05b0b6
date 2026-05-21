/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  ownerName?: string
  productTitle?: string
  productImage?: string
  startDate?: string
  endDate?: string
  totalPrice?: number
  currency?: string
  rentalId?: string
}

const RequestReminder2hRenterEmail = (p: Props) => {
  const period = p.startDate && p.endDate ? `${p.startDate} – ${p.endDate}` : undefined
  const cta = p.rentalId ? `${APP_URL}/rezervari` : `${APP_URL}/rezervari`
  const productLabel = p.productTitle ?? 'produsul ales'
  return (
    <BaseLayout preview={`Cererea ta pentru ${productLabel} așteaptă răspuns`}>
      <H1>Cererea ta așteaptă răspuns</H1>
      <Lead>
        Așteptăm răspunsul proprietarului <strong>{p.ownerName ?? ''}</strong> pentru cererea ta
        de închiriere „{productLabel}". Mai are aproximativ <strong>2 ore</strong> să răspundă —
        după care cererea va fi <strong>anulată automat</strong> și hold-ul de pe cardul tău
        va fi eliberat integral.
      </Lead>
      <ProductCard
        image={p.productImage}
        title={p.productTitle}
        period={period}
        totalPrice={p.totalPrice}
        currency={p.currency}
        status="pending"
      />
      <CTAButton href={cta}>Vezi cererea</CTAButton>
      <Para>
        Nu trebuie să faci nimic. Dacă proprietarul nu răspunde, vei primi o notificare și banii
        rămân blocați pe card maxim 7 zile, după care sunt eliberați automat de bancă.
      </Para>
    </BaseLayout>
  )
}

export const template = {
  component: RequestReminder2hRenterEmail,
  subject: 'Cererea ta așteaptă răspuns — mai sunt 2 ore',
  displayName: 'Reminder 2h cerere (Renter)',
  previewData: {
    ownerName: 'Maria Ionescu',
    productTitle: 'Bicicletă Mountain Bike Trek',
    productImage: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
    startDate: '15 ian 2026',
    endDate: '18 ian 2026',
    totalPrice: 240,
    currency: 'RON',
    rentalId: '326efd56-9af7-4af2-a57c-b0cdea56e5dd',
  },
} satisfies TemplateEntry