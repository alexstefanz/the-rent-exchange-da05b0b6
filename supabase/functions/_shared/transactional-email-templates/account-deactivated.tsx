/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para } from './_components.tsx'

const AccountDeletedEmail = () => (
  <BaseLayout preview="Contul tău Rentli a fost șters">
    <H1>Contul tău a fost șters definitiv</H1>
    <Lead>
      Am șters contul tău Rentli conform solicitării. Profilul, anunțurile și datele personale
      au fost eliminate. Istoricul închirierilor finalizate este păstrat anonimizat, conform obligațiilor legale și contabile.
    </Lead>
    <Para>Mulțumim că ai folosit Rentli. Ne pare rău că pleci!</Para>
  </BaseLayout>
)

export const template = {
  component: AccountDeletedEmail,
  subject: 'Contul tău Rentli a fost șters',
  displayName: 'Cont șters',
} satisfies TemplateEntry
