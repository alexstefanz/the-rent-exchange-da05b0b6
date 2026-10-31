/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, CTAButton } from './_components.tsx'

interface Props { confirmationLink?: string }

const AccountDeletionEmail = ({ confirmationLink = '#' }: Props) => (
  <BaseLayout preview="Confirmare ștergere cont Rentli">
    <H1>Confirmă ștergerea contului</H1>
    <Lead>
      Ai solicitat ștergerea definitivă a contului tău Rentli. Apasă butonul de mai jos pentru
      a confirma. Acțiunea este ireversibilă: profilul, anunțurile și datele personale vor fi șterse.
      Linkul este valabil 24 de ore.
    </Lead>
    <CTAButton href={confirmationLink} variant="danger">Confirmă ștergerea contului</CTAButton>
    <Para>Dacă nu ai făcut tu această cerere, ignoră acest email — contul tău rămâne activ.</Para>
  </BaseLayout>
)

export const template = {
  component: AccountDeletionEmail,
  subject: 'Confirmare ștergere cont Rentli',
  displayName: 'Ștergere cont',
  previewData: { confirmationLink: 'https://rentli.ro/dezactivare-cont?token=abc123' },
} satisfies TemplateEntry
