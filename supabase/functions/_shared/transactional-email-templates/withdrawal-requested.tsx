/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rentli'
const LOGO_URL = 'https://tsffyecastudajmgrckt.supabase.co/storage/v1/object/public/email-assets/rentli_logo.png'

interface Props { name?: string; amount?: number; ibanLast4?: string }

const WithdrawalRequestedEmail = ({ name, amount, ibanLast4 }: Props) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Cererea ta de retragere a fost înregistrată</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}>
          <Img src={LOGO_URL} alt="Rentli" width="120" height="40" style={logoStyle} />
        </div>
        <Heading style={h1}>
          {name ? `${name}, am primit cererea ta` : 'Cerere de retragere primită'}
        </Heading>
        <Text style={text}>
          Cererea ta de retragere a fost înregistrată cu succes și va fi procesată
          în 1-3 zile lucrătoare.
        </Text>
        <Section style={summaryBox}>
          <Text style={summaryRow}>Sumă: <strong>{amount ? `${amount} RON` : '—'}</strong></Text>
          {ibanLast4 && <Text style={summaryRow}>IBAN: <strong>•••• {ibanLast4}</strong></Text>}
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Cu drag, Echipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WithdrawalRequestedEmail,
  subject: 'Cererea ta de retragere a fost primită',
  displayName: 'Retragere – cerere',
  previewData: { name: 'Maria', amount: 250, ibanLast4: '1234' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#F59E0B', padding: '20px 25px', borderRadius: '8px 8px 0 0' }
const logoStyle = { display: 'block' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#302520', margin: '25px 25px 10px' }
const text = { fontSize: '14px', color: '#7D7471', lineHeight: '1.5', margin: '0 25px 15px' }
const summaryBox = { backgroundColor: '#FCFAF8', padding: '12px 16px', borderRadius: '12px', margin: '10px 25px 20px' }
const summaryRow = { fontSize: '14px', color: '#302520', margin: '4px 0' }
const hr = { borderColor: '#eee', margin: '20px 25px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 25px 25px' }