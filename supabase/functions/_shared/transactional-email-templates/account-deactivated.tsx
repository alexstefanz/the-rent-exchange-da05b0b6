/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, CTAButton, APP_URL, SUPPORT_EMAIL, ReasonBox } from './_components.tsx'

const AccountDeactivatedEmail = () => (
  <BaseLayout preview="Contul tău Rentli a fost dezactivat">
    <H1>Contul tău a fost dezactivat</H1>
    <Lead>
      Am dezactivat contul tău Rentli conform solicitării. Anunțurile tale nu mai sunt vizibile,
      iar autentificarea este suspendată.
    </Lead>
    <ReasonBox label="Te-ai răzgândit?" tone="info">
      Poți reactiva contul scriindu-ne la {SUPPORT_EMAIL} în următoarele 30 de zile.
    </ReasonBox>
    <CTAButton href={`${APP_URL}/suport`} variant="ghost">Contactează suport</CTAButton>
    <Para>Mulțumim că ai folosit Rentli. Ne pare rău că pleci!</Para>
  </BaseLayout>
)

export const template = {
  component: AccountDeactivatedEmail,
  subject: 'Contul tău Rentli a fost dezactivat',
  displayName: 'Cont dezactivat',
} satisfies TemplateEntry