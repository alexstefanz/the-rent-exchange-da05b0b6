/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rentli'
const LOGO_URL = 'https://tsffyecastudajmgrckt.supabase.co/storage/v1/object/public/email-assets/rentli_logo.png'
const APP_URL = 'https://rentli.ro'

interface Props { name?: string; reason?: string }

const AccountBannedEmail = ({ name, reason }: Props) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Contul tău a fost suspendat</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}>
          <Img src={LOGO_URL} alt="Rentli" width="120" height="40" style={logoStyle} />
        </div>
        <Heading style={h1}>Cont suspendat</Heading>
        <Text style={text}>
          {name ? `${name}, c` : 'C'}ontul tău Rentli a fost suspendat. Dacă crezi că este o eroare,
          te rugăm să ne contactezi.
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
  component: AccountBannedEmail,
  subject: 'Contul tău Rentli a fost suspendat',
  displayName: 'Cont banat',
  previewData: { name: 'Maria', reason: 'Încălcare termeni.' },
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