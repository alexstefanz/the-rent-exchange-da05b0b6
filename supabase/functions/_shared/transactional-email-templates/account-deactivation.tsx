/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, CTAButton } from './_components.tsx'

interface Props { confirmationLink?: string }

const AccountDeactivationEmail = ({ confirmationLink = '#' }: Props) => (
  <BaseLayout preview="Confirmare dezactivare cont Rentli">
    <H1>Confirmă dezactivarea contului</H1>
    <Lead>
      Ai solicitat dezactivarea contului tău Rentli. Apasă butonul de mai jos pentru
      a confirma — acțiunea este reversibilă timp de 30 de zile.
    </Lead>
    <CTAButton href={confirmationLink} variant="danger">Confirmă dezactivarea</CTAButton>
    <Para>Dacă nu ai făcut tu această cerere, ignoră acest email — contul tău rămâne activ.</Para>
  </BaseLayout>
)

export const template = {
  component: AccountDeactivationEmail,
  subject: 'Confirmare dezactivare cont Rentli',
  displayName: 'Dezactivare cont',
  previewData: { confirmationLink: 'https://rentli.ro/confirm-deactivation?token=abc123' },
} satisfies TemplateEntry
