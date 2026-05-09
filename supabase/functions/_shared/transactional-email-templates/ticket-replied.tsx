/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, StatusBadge, InfoRow, MessagePreview, CTAButton, APP_URL, Section } from './_components.tsx'

interface Props { name?: string; ticketId?: string; messagePreview?: string }

const TicketRepliedEmail = ({ name, ticketId, messagePreview }: Props) => (
  <BaseLayout preview={`Răspuns nou la tichetul ${ticketId ?? ''}`}>
    <H1>{name ? `${name}, ai un răspuns nou` : 'Răspuns nou la tichetul tău'}</H1>
    <Section style={{ margin: '0 0 14px' }}><StatusBadge kind="info" label="Răspuns suport" /></Section>
    {ticketId && <InfoRow label="Tichet" value={ticketId} />}
    {messagePreview && <div style={{ marginTop: 12 }}><MessagePreview sender="Echipa Rentli">{messagePreview}</MessagePreview></div>}
    <CTAButton href={`${APP_URL}/suport`}>Vezi conversația</CTAButton>
    <Para>Răspunde din contul tău pentru a continua conversația în siguranță.</Para>
  </BaseLayout>
)

export const template = {
  component: TicketRepliedEmail,
  subject: (data) => `Răspuns nou la tichetul ${data?.ticketId || ''}`,
  displayName: 'Răspuns admin la tichet',
  previewData: { name: 'Maria', ticketId: 'TCK-000123', messagePreview: 'Bună, am verificat plata și am procesat returul...' },
} satisfies TemplateEntry
