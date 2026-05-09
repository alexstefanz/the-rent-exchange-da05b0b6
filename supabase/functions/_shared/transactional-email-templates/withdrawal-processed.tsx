/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, StatusBadge, InfoRow, CTAButton, APP_URL, Section } from './_components.tsx'

interface Props { name?: string; amount?: number; ibanLast4?: string }

const WithdrawalProcessedEmail = ({ name, amount, ibanLast4 }: Props) => (
  <BaseLayout preview="Retragerea ta a fost procesată ✓">
    <H1>{name ? `${name}, retragerea ta a fost trimisă ✓` : 'Retragere procesată ✓'}</H1>
    <Section style={{ margin: '0 0 14px' }}><StatusBadge kind="completed" label="Plătită" /></Section>
    <Lead>Banii sunt pe drum spre contul tău. Banca îi poate procesa în 1-3 zile lucrătoare.</Lead>
    {amount !== undefined && <InfoRow label="Sumă transferată" value={`${amount.toLocaleString('ro-RO')} RON`} />}
    {ibanLast4 && <InfoRow label="Cont destinație" value={`•••• ${ibanLast4}`} />}
    <CTAButton href={`${APP_URL}/profile`}>Vezi tranzacțiile</CTAButton>
  </BaseLayout>
)

export const template = {
  component: WithdrawalProcessedEmail,
  subject: 'Retragerea ta a fost procesată ✓',
  displayName: 'Retragere – procesată',
  previewData: { name: 'Maria', amount: 250, ibanLast4: '1234' },
} satisfies TemplateEntry
