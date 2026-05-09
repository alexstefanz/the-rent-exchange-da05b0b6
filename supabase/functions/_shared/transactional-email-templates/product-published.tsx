/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ProductCard, CTAButton, APP_URL } from './_components.tsx'

interface Props {
  productTitle?: string
  productImage?: string
  productId?: string
}

const ProductPublishedEmail = (p: Props) => (
  <BaseLayout preview={`${p.productTitle ?? 'Produsul tău'} este live pe Rentli`}>
    <H1>🎉 Produsul tău este live!</H1>
    <Lead>
      Anunțul a fost aprobat și apare acum în căutările publice. Primele cereri pot
      ajunge în câteva ore.
    </Lead>
    <ProductCard image={p.productImage} title={p.productTitle} status="approved" statusLabel="Publicat" />
    <CTAButton href={p.productId ? `${APP_URL}/produs/${p.productId}` : `${APP_URL}/profile`}>
      Vezi anunțul
    </CTAButton>
    <Para>Sfat: răspunde rapid la primele mesaje pentru a-ți crește rata de conversie.</Para>
  </BaseLayout>
)

export const template = {
  component: ProductPublishedEmail,
  subject: 'Produsul tău a fost publicat pe Rentli! 🎉',
  displayName: 'Produs publicat',
  previewData: {
    productTitle: 'Bicicletă Mountain Bike Trek',
    productImage: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
    productId: 'abc',
  },
} satisfies TemplateEntry
