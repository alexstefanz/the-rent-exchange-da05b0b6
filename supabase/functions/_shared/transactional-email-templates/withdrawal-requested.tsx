/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, StatusBadge, InfoRow, CTAButton, APP_URL, Section } from './_components.tsx'

interface Props { name?: string; amount?: number; ibanLast4?: string }

const WithdrawalRequestedEmail = ({ name, amount, ibanLast4 }: Props) => (
  <BaseLayout preview="Cererea ta de retragere a fost primită">
    <H1>{name ? `Salut ${name},` : 'Cerere de retragere primită'}</H1>
    <Section style={{ margin: '0 0 14px' }}><StatusBadge kind="pending" label="În procesare" /></Section>
    <Lead>Am primit cererea ta de retragere. O vom procesa în maxim 2 zile lucrătoare.</Lead>
    {amount !== undefined && <InfoRow label="Sumă" value={`${amount.toLocaleString('ro-RO')} RON`} />}
    {ibanLast4 && <InfoRow label="IBAN" value={`•••• ${ibanLast4}`} />}
    <CTAButton href={`${APP_URL}/profile`}>Vezi soldul</CTAButton>
  </BaseLayout>
)

export const template = {
  component: WithdrawalRequestedEmail,
  subject: 'Cererea ta de retragere a fost primită',
  displayName: 'Retragere – cerere',
  previewData: { name: 'Maria', amount: 250, ibanLast4: '1234' },
} satisfies TemplateEntry
