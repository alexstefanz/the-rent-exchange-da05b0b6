/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ReasonBox, CTAButton, APP_URL } from './_components.tsx'

interface Props { name?: string; productTitle?: string; productId?: string; reason?: string }

const ProductRejectedEmail = (p: Props) => (
  <BaseLayout preview={`Anunțul "${p.productTitle ?? ''}" necesită ajustări`}>
    <H1>Anunțul tău necesită ajustări</H1>
    <Lead>
      {p.name ? `${p.name}, ` : ''}am revizuit anunțul <strong>{p.productTitle ?? 'tău'}</strong> și
      am identificat câteva detalii de îmbunătățit înainte de publicare.
    </Lead>
    {p.reason && <ReasonBox label="Detalii">{p.reason}</ReasonBox>}
    <CTAButton href={p.productId ? `${APP_URL}/produs/editeaza/${p.productId}` : `${APP_URL}/profile`}>
      Editează anunțul
    </CTAButton>
    <Para>După ajustări, anunțul intră automat în coada de aprobare.</Para>
  </BaseLayout>
)

export const template = {
  component: ProductRejectedEmail,
  subject: (data) => `Anunțul "${data?.productTitle || ''}" necesită ajustări`,
  displayName: 'Produs respins',
  previewData: { name: 'Maria', productTitle: 'Bormașină Bosch', productId: 'abc', reason: 'Imaginile sunt neclare. Te rugăm să încarci poze cu lumină naturală.' },
} satisfies TemplateEntry
