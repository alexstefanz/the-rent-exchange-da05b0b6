/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, StatusBadge, CTAButton, APP_URL, Section } from './_components.tsx'

interface Props { name?: string }

const KycApprovedEmail = ({ name }: Props) => (
  <BaseLayout preview="Identitatea ta a fost verificată">
    <H1>{name ? `${name}, ești verificat ✓` : 'Identitatea ta a fost verificată ✓'}</H1>
    <Section style={{ margin: '0 0 14px' }}><StatusBadge kind="approved" label="Cont verificat" /></Section>
    <Lead>
      Felicitări! Contul tău este complet verificat. Poți închiria fără restricții și
      câștigi încredere instant în comunitate cu badge-ul „Verificat".
    </Lead>
    <CTAButton href={`${APP_URL}/owner/new-product`}>Adaugă primul tău produs</CTAButton>
    <Para>Listează acum și începe să câștigi din lucrurile pe care nu le folosești zilnic.</Para>
  </BaseLayout>
)

export const template = {
  component: KycApprovedEmail,
  subject: 'Identitatea ta a fost verificată ✓',
  displayName: 'KYC aprobat',
  previewData: { name: 'Maria' },
} satisfies TemplateEntry
