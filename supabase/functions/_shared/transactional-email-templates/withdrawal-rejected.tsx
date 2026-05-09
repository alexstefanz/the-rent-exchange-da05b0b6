/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, StatusBadge, InfoRow, ReasonBox, CTAButton, APP_URL, Section } from './_components.tsx'

interface Props { name?: string; amount?: number; reason?: string }

const WithdrawalRejectedEmail = ({ name, amount, reason }: Props) => (
  <BaseLayout preview="Cererea ta de retragere a fost respinsă">
    <H1>{name ? `${name}, retragere respinsă` : 'Cerere de retragere respinsă'}</H1>
    <Section style={{ margin: '0 0 14px' }}><StatusBadge kind="declined" label="Respinsă" /></Section>
    <Lead>Cererea ta de retragere nu a putut fi procesată. Suma a fost returnată în soldul tău.</Lead>
    {amount !== undefined && <InfoRow label="Sumă" value={`${amount.toLocaleString('ro-RO')} RON`} />}
    {reason && <ReasonBox label="Motiv" tone="danger">{reason}</ReasonBox>}
    <CTAButton href={`${APP_URL}/profile`}>Verifică datele bancare</CTAButton>
  </BaseLayout>
)

export const template = {
  component: WithdrawalRejectedEmail,
  subject: 'Cererea ta de retragere a fost respinsă',
  displayName: 'Retragere – respinsă',
  previewData: { name: 'Maria', amount: 250, reason: 'IBAN invalid sau cont închis.' },
} satisfies TemplateEntry
