/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, StatusBadge, InfoRow, CTAButton, APP_URL, Section } from './_components.tsx'

interface Props { name?: string; amount?: number; productTitle?: string }

const PayoutReceivedEmail = ({ name, amount, productTitle }: Props) => (
  <BaseLayout preview="Câștig nou adăugat în balanță 🎉">
    <H1>{name ? `${name}, ai un câștig nou 🎉` : 'Câștig nou în balanța ta 🎉'}</H1>
    <Section style={{ margin: '0 0 14px' }}><StatusBadge kind="completed" label="Adăugat în sold" /></Section>
    <Lead>O închiriere s-a finalizat cu succes și suma a fost virată în soldul tău Rentli.</Lead>
    {productTitle && <InfoRow label="Produs" value={productTitle} />}
    {amount !== undefined && <InfoRow label="Sumă încasată" value={`+${amount.toLocaleString('ro-RO')} RON`} />}
    <div style={{ marginTop: 18 }}>
      <CTAButton href={`${APP_URL}/profile`}>Solicită retragere</CTAButton>
    </div>
    <Para>Poți solicita oricând transferul în contul tău bancar.</Para>
  </BaseLayout>
)

export const template = {
  component: PayoutReceivedEmail,
  subject: 'Câștig nou adăugat în balanță 🎉',
  displayName: 'Payout primit',
  previewData: { name: 'Maria', amount: 95, productTitle: 'Bormașină Bosch' },
} satisfies TemplateEntry
