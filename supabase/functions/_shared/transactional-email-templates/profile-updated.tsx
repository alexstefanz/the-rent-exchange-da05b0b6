/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, CTAButton, APP_URL, InfoRow, ReasonBox, SUPPORT_EMAIL } from './_components.tsx'

interface Props {
  changes?: { label: string; value: string }[]
}

const ProfileUpdatedEmail = ({ changes = [] }: Props) => (
  <BaseLayout preview="Datele contului tău Rentli au fost actualizate">
    <H1>Datele contului au fost actualizate</H1>
    <Lead>Am înregistrat modificări la datele contului tău Rentli.</Lead>
    {changes.length > 0 && (
      <div style={{ margin: '8px 0 18px' }}>
        {changes.map((c, i) => (
          <InfoRow key={i} label={c.label} value={c.value} />
        ))}
      </div>
    )}
    <CTAButton href={`${APP_URL}/contul-meu`}>Vezi contul meu</CTAButton>
    <ReasonBox label="Nu ai făcut tu această modificare?" tone="danger">
      Contactează imediat echipa de suport la {SUPPORT_EMAIL} pentru a-ți securiza contul.
    </ReasonBox>
    <Para>Acest mesaj este trimis pentru siguranța contului tău.</Para>
  </BaseLayout>
)

export const template = {
  component: ProfileUpdatedEmail,
  subject: 'Datele contului tău Rentli au fost actualizate',
  displayName: 'Date cont actualizate',
  previewData: { changes: [{ label: 'Nume complet', value: 'Maria Pop' }, { label: 'Telefon', value: '+40 7•• ••• 123' }] },
} satisfies TemplateEntry