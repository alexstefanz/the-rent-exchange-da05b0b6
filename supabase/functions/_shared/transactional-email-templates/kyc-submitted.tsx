/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, StatusBadge, Section } from './_components.tsx'

interface Props { name?: string }

const KycSubmittedEmail = ({ name }: Props) => (
  <BaseLayout preview="Documentele tale au fost primite">
    <H1>{name ? `Mulțumim, ${name}!` : 'Mulțumim!'}</H1>
    <Section style={{ margin: '0 0 12px' }}><StatusBadge kind="pending" label="Verificare KYC în curs" /></Section>
    <Lead>
      Am primit documentele tale și echipa noastră le revizuiește. De obicei procesul
      durează maxim 24 de ore. Îți trimitem un email imediat ce decizia este luată.
    </Lead>
    <Para>Mulțumim pentru răbdare — verificarea KYC ne ajută să menținem comunitatea în siguranță.</Para>
  </BaseLayout>
)

export const template = {
  component: KycSubmittedEmail,
  subject: 'Documentele tale au fost primite',
  displayName: 'KYC trimis',
  previewData: { name: 'Maria' },
} satisfies TemplateEntry
