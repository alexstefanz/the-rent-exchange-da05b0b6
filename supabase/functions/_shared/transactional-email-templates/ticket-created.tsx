/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, StatusBadge, InfoRow, CTAButton, APP_URL, Section } from './_components.tsx'

interface Props { name?: string; ticketId?: string; ticketTitle?: string }

const TicketCreatedEmail = ({ name, ticketId, ticketTitle }: Props) => (
  <BaseLayout preview={`Tichet creat: ${ticketId ?? ''}`}>
    <H1>{name ? `Mulțumim, ${name}!` : 'Tichet creat'}</H1>
    <Section style={{ margin: '0 0 14px' }}><StatusBadge kind="pending" label="Nou" /></Section>
    <Lead>Tichetul tău a fost înregistrat cu succes. Echipa de suport îți răspunde în cel mai scurt timp.</Lead>
    {ticketId && <InfoRow label="Număr tichet" value={ticketId} />}
    {ticketTitle && <InfoRow label="Subiect" value={ticketTitle} />}
    <div style={{ marginTop: 18 }}>
      <CTAButton href={`${APP_URL}/suport`}>Vezi tichetul</CTAButton>
    </div>
    <Para>Răspunsurile se trimit pe email și apar și în istoricul tău din contul Rentli.</Para>
  </BaseLayout>
)

export const template = {
  component: TicketCreatedEmail,
  subject: (data) => `Tichet creat: ${data?.ticketId || ''}`,
  displayName: 'Tichet creat',
  previewData: { name: 'Maria', ticketId: 'TCK-000123', ticketTitle: 'Problemă plată' },
} satisfies TemplateEntry
