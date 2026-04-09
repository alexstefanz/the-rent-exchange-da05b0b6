/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Img, Preview, Text, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rentli'
const LOGO_URL = 'https://tsffyecastudajmgrckt.supabase.co/storage/v1/object/public/email-assets/rentli_logo.png'

interface Props {
  productTitle?: string
}

const CancellationRenterEmail = ({ productTitle = 'produsul solicitat' }: Props) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Cererea ta de închiriere a fost anulată</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}><Img src={LOGO_URL} alt="Rentli" width="120" height="40" style={logoStyle} /></div>
        <Heading style={h1}>Cerere anulată</Heading>
        <Text style={text}>
          Cererea ta de închiriere pentru <strong>{productTitle}</strong> a fost anulată cu succes.
        </Text>
        <Text style={text}>Poți oricând să cauți alte produse disponibile pe platformă.</Text>
        <Hr style={hr} />
        <Text style={footer}>Cu drag, Echipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CancellationRenterEmail,
  subject: 'Cererea ta de închiriere a fost anulată',
  displayName: 'Anulare (Renter)',
  previewData: { productTitle: 'Bicicletă Mountain Bike' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#F59E0B', padding: '20px 25px', borderRadius: '8px 8px 0 0' }
const logoStyle = { display: 'block' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#302520', margin: '25px 25px 10px' }
const text = { fontSize: '14px', color: '#7D7471', lineHeight: '1.5', margin: '0 25px 15px' }
const hr = { borderColor: '#eee', margin: '20px 25px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 25px 25px' }
