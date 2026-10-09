/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, ReasonBox } from './_components.tsx'

interface Props { code?: string; publicId?: string; ref?: string }

const ContractOtpEmail = ({ code = '••••••', publicId = '', ref = '' }: Props) => (
  <BaseLayout preview={`Codul tău pentru semnarea contractului ${publicId}`}>
    <H1>🔐 Cod de semnare contract</H1>
    <Lead>Folosește codul de mai jos pentru a semna contractul {publicId}.</Lead>
    <ReasonBox label="Codul tău" tone="info">
      <span style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '6px' }}>{code}</span>
    </ReasonBox>
    <Para>Codul expiră în 10 minute. Referință: {ref}.</Para>
    <Para>Dacă nu ai solicitat acest cod, ignoră acest email și nu îl comunica nimănui.</Para>
  </BaseLayout>
)

export const template = {
  component: ContractOtpEmail,
  subject: (d: Record<string, any>) => `Cod semnare contract ${d.publicId ?? ''}`.trim(),
  displayName: 'Cod OTP semnare contract',
  previewData: { code: '123456', publicId: 'RNT-000123', ref: 'VRF-ABC123' },
} satisfies TemplateEntry
