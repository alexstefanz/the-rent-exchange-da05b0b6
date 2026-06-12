/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, CTAButton, APP_URL, InfoRow, ReasonBox, SUPPORT_EMAIL } from './_components.tsx'

interface Props { maskedIban?: string; holderName?: string }

const IbanAddedEmail = ({ maskedIban = '', holderName = '' }: Props) => (
  <BaseLayout preview="Un IBAN nou a fost adăugat în contul tău Rentli">
    <H1>IBAN adăugat în cont</H1>
    <Lead>Ai adăugat un cont bancar nou pentru retrageri în Rentli.</Lead>
    <div style={{ margin: '8px 0 18px' }}>
      {holderName ? <InfoRow label="Titular" value={holderName} /> : null}
      {maskedIban ? <InfoRow label="IBAN" value={maskedIban} /> : null}
    </div>
    <CTAButton href={`${APP_URL}/castiguri`}>Vezi metodele de retragere</CTAButton>
    <ReasonBox label="Nu ai adăugat tu acest IBAN?" tone="danger">
      Șterge-l imediat din contul tău și contactează suportul la {SUPPORT_EMAIL}.
    </ReasonBox>
    <Para>Banii din retrageri vor fi virați doar către IBAN-uri adăugate manual de tine.</Para>
  </BaseLayout>
)

export const template = {
  component: IbanAddedEmail,
  subject: 'IBAN nou adăugat în contul tău Rentli',
  displayName: 'IBAN adăugat',
  previewData: { maskedIban: 'RO** **** **** **** **** 1234', holderName: 'Maria Pop' },
} satisfies TemplateEntry