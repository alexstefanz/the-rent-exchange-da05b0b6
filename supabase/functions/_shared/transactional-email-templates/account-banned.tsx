/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ReasonBox, CTAButton, APP_URL } from './_components.tsx'

interface Props { name?: string; reason?: string }

const AccountBannedEmail = ({ name, reason }: Props) => (
  <BaseLayout preview="Contul tău Rentli a fost suspendat">
    <H1>Cont suspendat</H1>
    <Lead>
      {name ? `${name}, ` : ''}contul tău a fost suspendat de către echipa Rentli.
      Dacă crezi că este o eroare, te rugăm să ne contactezi.
    </Lead>
    {reason && <ReasonBox label="Motiv" tone="danger">{reason}</ReasonBox>}
    <CTAButton href={`${APP_URL}/suport`}>Contactează suport</CTAButton>
  </BaseLayout>
)

export const template = {
  component: AccountBannedEmail,
  subject: 'Contul tău Rentli a fost suspendat',
  displayName: 'Cont banat',
  previewData: { name: 'Maria', reason: 'Încălcare termeni — contact direct între utilizatori.' },
} satisfies TemplateEntry
