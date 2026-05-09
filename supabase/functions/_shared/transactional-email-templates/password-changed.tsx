/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, CTAButton, APP_URL, ReasonBox } from './_components.tsx'

const PasswordChangedEmail = () => (
  <BaseLayout preview="Parola contului tău Rentli a fost schimbată">
    <H1>🔒 Parolă schimbată</H1>
    <Lead>Parola contului tău Rentli a fost actualizată cu succes.</Lead>
    <ReasonBox label="Nu ai făcut tu această modificare?" tone="danger">
      Contactează imediat echipa de suport pentru a-ți securiza contul.
    </ReasonBox>
    <CTAButton href={`${APP_URL}/suport`} variant="ghost">Contactează suport</CTAButton>
    <Para>Pentru protecție suplimentară, recomandăm o parolă unică, folosită doar pe Rentli.</Para>
  </BaseLayout>
)

export const template = {
  component: PasswordChangedEmail,
  subject: 'Parola contului tău a fost schimbată',
  displayName: 'Parolă schimbată',
} satisfies TemplateEntry
