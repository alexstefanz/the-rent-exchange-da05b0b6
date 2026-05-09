/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, StatusBadge, CTAButton, APP_URL, Section } from './_components.tsx'

interface Props { name?: string }

const KycReuploadEmail = ({ name }: Props) => (
  <BaseLayout preview="Trebuie să reîncarci documentele de identitate">
    <H1>{name ? `${name}, reîncarcă documentele` : 'Reîncarcă documentele'}</H1>
    <Section style={{ margin: '0 0 14px' }}><StatusBadge kind="info" label="Reupload solicitat" /></Section>
    <Lead>
      Echipa noastră a solicitat o nouă încărcare a documentelor pentru a finaliza
      verificarea identității. Procesul durează doar câteva minute.
    </Lead>
    <CTAButton href={`${APP_URL}/verificare`}>Încarcă documentele</CTAButton>
    <Para>Fotografiază documentul cu lumină naturală, evitând reflexiile.</Para>
  </BaseLayout>
)

export const template = {
  component: KycReuploadEmail,
  subject: 'Reîncarcă documentele pentru verificare',
  displayName: 'KYC – cerere reupload',
  previewData: { name: 'Maria' },
} satisfies TemplateEntry
