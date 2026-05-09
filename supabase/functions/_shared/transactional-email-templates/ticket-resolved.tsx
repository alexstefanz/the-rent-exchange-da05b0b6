/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, StatusBadge, InfoRow, CTAButton, APP_URL, Section } from './_components.tsx'

interface Props { name?: string; ticketId?: string }

const TicketResolvedEmail = ({ name, ticketId }: Props) => (
  <BaseLayout preview={`Tichet închis: ${ticketId ?? ''}`}>
    <H1>{name ? `${name}, tichetul tău a fost închis ✓` : 'Tichetul tău a fost închis ✓'}</H1>
    <Section style={{ margin: '0 0 14px' }}><StatusBadge kind="completed" label="Rezolvat" /></Section>
    {ticketId && <InfoRow label="Tichet" value={ticketId} />}
    <Lead>Mulțumim că ne-ai contactat. Dacă mai apar întrebări, redeschide tichetul oricând.</Lead>
    <CTAButton href={`${APP_URL}/suport`}>Vezi istoricul</CTAButton>
  </BaseLayout>
)

export const template = {
  component: TicketResolvedEmail,
  subject: (data) => `Tichet închis: ${data?.ticketId || ''}`,
  displayName: 'Tichet rezolvat',
  previewData: { name: 'Maria', ticketId: 'TCK-000123' },
} satisfies TemplateEntry
