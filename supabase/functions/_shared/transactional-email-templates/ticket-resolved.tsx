/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rentli'
const LOGO_URL = 'https://tsffyecastudajmgrckt.supabase.co/storage/v1/object/public/email-assets/rentli_logo.png'
const APP_URL = 'https://rentli.ro'

interface Props { name?: string; ticketId?: string }

const TicketResolvedEmail = ({ name, ticketId }: Props) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Tichetul tău a fost închis</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}>
          <Img src={LOGO_URL} alt="Rentli" width="120" height="40" style={logoStyle} />
        </div>
        <Heading style={h1}>Tichet rezolvat ✓</Heading>
        <Text style={text}>
          {name ? `${name}, t` : 'T'}ichetul {ticketId ? <strong>{ticketId}</strong> : ''} a fost
          marcat ca rezolvat. Dacă mai ai întrebări, ne poți scrie oricând.
        </Text>
        <Button href={`${APP_URL}/suport`} style={button}>Deschide un nou tichet</Button>
        <Hr style={hr} />
        <Text style={footer}>Cu drag, Echipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TicketResolvedEmail,
  subject: (data) => `Tichet închis: ${data?.ticketId || ''}`,
  displayName: 'Tichet rezolvat',
  previewData: { name: 'Maria', ticketId: 'TCK-000123' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#F59E0B', padding: '20px 25px', borderRadius: '8px 8px 0 0' }
const logoStyle = { display: 'block' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#302520', margin: '25px 25px 10px' }
const text = { fontSize: '14px', color: '#7D7471', lineHeight: '1.5', margin: '0 25px 15px' }
const button = { backgroundColor: '#F59E0B', color: '#ffffff', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', display: 'inline-block', margin: '10px 25px', fontWeight: 600 }
const hr = { borderColor: '#eee', margin: '20px 25px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 25px 25px' }