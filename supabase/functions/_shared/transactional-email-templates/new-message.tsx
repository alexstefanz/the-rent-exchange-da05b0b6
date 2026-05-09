/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, MessagePreview, Avatar, CTAButton, APP_URL, Section, Text } from './_components.tsx'

interface Props {
  senderName?: string
  productTitle?: string
  messagePreview?: string
}

const NewMessageEmail = (p: Props) => (
  <BaseLayout preview={`${p.senderName ?? 'Cineva'} ți-a trimis un mesaj nou`}>
    <H1>Ai un mesaj nou 💬</H1>
    <table cellPadding={0} cellSpacing={0} role="presentation" style={{ margin: '0 0 16px' }}>
      <tbody>
        <tr>
          <td style={{ paddingRight: 12, verticalAlign: 'middle' as const }}><Avatar name={p.senderName} /></td>
          <td style={{ verticalAlign: 'middle' as const }}>
            <Text style={{ fontSize: 15, fontWeight: 700, color: '#1A1410', margin: 0 }}>{p.senderName ?? 'Un utilizator'}</Text>
            {p.productTitle && <Text style={{ fontSize: 13, color: '#6B6360', margin: 0 }}>despre {p.productTitle}</Text>}
          </td>
        </tr>
      </tbody>
    </table>
    {p.messagePreview && <MessagePreview>{p.messagePreview}</MessagePreview>}
    <CTAButton href={`${APP_URL}/mesaje`}>Răspunde mesajului</CTAButton>
    <Para>Răspunde rapid pentru o experiență excelentă în comunitatea Rentli.</Para>
  </BaseLayout>
)

export const template = {
  component: NewMessageEmail,
  subject: 'Ai primit un mesaj nou pe Rentli',
  displayName: 'Mesaj nou',
  previewData: {
    senderName: 'Ion Popescu',
    productTitle: 'Bicicletă Mountain Bike Trek',
    messagePreview: 'Bună! Este disponibilă weekendul acesta? Aș vrea să o închiriez vineri.',
  },
} satisfies TemplateEntry
