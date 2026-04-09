/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Img, Preview, Text, Button, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rentli'
const LOGO_URL = 'https://tsffyecastudajmgrckt.supabase.co/storage/v1/object/public/email-assets/rentli_logo.png'

interface Props {
  productTitle?: string
  ownerName?: string
  startDate?: string
  endDate?: string
}

const RentalAcceptedEmail = ({ productTitle = 'produsul solicitat', ownerName = 'Proprietarul', startDate, endDate }: Props) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Cererea ta a fost acceptată!</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}><Img src={LOGO_URL} alt="Rentli" width="120" height="40" style={logoStyle} /></div>
        <Heading style={h1}>🎉 Cererea ta a fost acceptată!</Heading>
        <Text style={text}>
          <strong>{ownerName}</strong> a acceptat cererea ta pentru <strong>{productTitle}</strong>
          {startDate && endDate ? ` (${startDate} – ${endDate})` : ''}.
        </Text>
        <Text style={text}>Poți continua cu plata și organizarea ridicării.</Text>
        <Button style={button} href="https://rentli.ro/rentals">Vezi detalii</Button>
        <Hr style={hr} />
        <Text style={footer}>Cu drag, Echipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RentalAcceptedEmail,
  subject: 'Cererea ta de închiriere a fost acceptată! 🎉',
  displayName: 'Cerere acceptată',
  previewData: { productTitle: 'Bicicletă Mountain Bike', ownerName: 'Maria Ionescu', startDate: '15 ian 2025', endDate: '18 ian 2025' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#F59E0B', padding: '20px 25px', borderRadius: '8px 8px 0 0' }
const logoStyle = { display: 'block' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#302520', margin: '25px 25px 10px' }
const text = { fontSize: '14px', color: '#7D7471', lineHeight: '1.5', margin: '0 25px 15px' }
const button = { backgroundColor: '#F59E0B', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block', margin: '10px 25px 20px' }
const hr = { borderColor: '#eee', margin: '20px 25px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 25px 25px' }
