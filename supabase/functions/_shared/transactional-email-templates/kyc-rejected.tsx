/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, StatusBadge, ReasonBox, CTAButton, APP_URL, Section } from './_components.tsx'

interface Props { name?: string; reason?: string }

const KycRejectedEmail = ({ name, reason }: Props) => (
  <BaseLayout preview="Verificarea identității nu a fost aprobată">
    <H1>{name ? `${name}, verificarea nu a fost aprobată` : 'Verificarea nu a fost aprobată'}</H1>
    <Section style={{ margin: '0 0 14px' }}><StatusBadge kind="declined" label="KYC neaprobat" /></Section>
    <Lead>
      Documentele trimise nu au putut fi validate. Te rugăm să încerci din nou
      după ce verifici detaliile de mai jos.
    </Lead>
    {reason && <ReasonBox label="Motiv" tone="danger">{reason}</ReasonBox>}
    <CTAButton href={`${APP_URL}/verificare`}>Reîncearcă verificarea</CTAButton>
    <Para>Pentru cele mai bune rezultate: documente lizibile, lumină naturală, fără reflexii.</Para>
  </BaseLayout>
)

export const template = {
  component: KycRejectedEmail,
  subject: 'Verificarea identității nu a fost aprobată',
  displayName: 'KYC respins',
  previewData: { name: 'Maria', reason: 'Documentul este neclar sau colțurile sunt tăiate.' },
} satisfies TemplateEntry
