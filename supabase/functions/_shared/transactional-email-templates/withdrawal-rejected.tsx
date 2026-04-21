/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rentli'
const LOGO_URL = 'https://tsffyecastudajmgrckt.supabase.co/storage/v1/object/public/email-assets/rentli_logo.png'
const APP_URL = 'https://rentli.ro'

interface Props { name?: string; amount?: number; reason?: string }

const WithdrawalRejectedEmail = ({ name, amount, reason }: Props) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Cererea ta de retragere nu a putut fi procesată</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}>
          <Img src={LOGO_URL} alt="Rentli" width="120" height="40" style={logoStyle} />
        </div>
        <Heading style={h1}>Retragere respinsă</Heading>
        <Text style={text}>
          {name ? `${name}, c` : 'C'}ererea ta de retragere{amount ? ` de ${amount} RON` : ''} nu a putut fi
          procesată. Suma rămâne disponibilă în balanța ta.
        </Text>
        {reason && (
          <Section style={reasonBox}>
            <Text style={reasonLabel}>Motiv:</Text>
            <Text style={reasonText}>{reason}</Text>
          </Section>
        )}
        <Button href={`${APP_URL}/suport`} style={button}>Contactează suport</Button>
        <Hr style={hr} />
        <Text style={footer}>Cu drag, Echipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WithdrawalRejectedEmail,
  subject: 'Cererea ta de retragere a fost respinsă',
  displayName: 'Retragere – respinsă',
  previewData: { name: 'Maria', amount: 250, reason: 'IBAN invalid.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#F59E0B', padding: '20px 25px', borderRadius: '8px 8px 0 0' }
const logoStyle = { display: 'block' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#302520', margin: '25px 25px 10px' }
const text = { fontSize: '14px', color: '#7D7471', lineHeight: '1.5', margin: '0 25px 15px' }
const reasonBox = { backgroundColor: '#FEF3C7', padding: '12px 16px', borderRadius: '12px', margin: '10px 25px 20px' }
const reasonLabel = { fontSize: '12px', color: '#92400E', fontWeight: 600 as const, margin: '0 0 4px' }
const reasonText = { fontSize: '14px', color: '#302520', margin: 0 }
const button = { backgroundColor: '#F59E0B', color: '#ffffff', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', display: 'inline-block', margin: '10px 25px', fontWeight: 600 }
const hr = { borderColor: '#eee', margin: '20px 25px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 25px 25px' }