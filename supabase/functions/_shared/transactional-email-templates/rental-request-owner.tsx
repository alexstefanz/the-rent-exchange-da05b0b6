/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Img, Preview, Text, Button, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rentli'
const LOGO_URL = 'https://tsffyecastudajmgrckt.supabase.co/storage/v1/object/public/email-assets/rentli_logo.png'

interface Props {
  renterName?: string
  productTitle?: string
  startDate?: string
  endDate?: string
  rentalId?: string
}

const RentalRequestOwnerEmail = ({ renterName = 'Un utilizator', productTitle = 'produsul tău', startDate, endDate, rentalId }: Props) => {
  const ctaHref = rentalId
    ? `https://rentli.ro/inchirieri?rental_id=${rentalId}`
    : 'https://rentli.ro/inchirieri'
  return (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Ai primit o cerere nouă de închiriere pe {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}>
          <Img src={LOGO_URL} alt="Rentli" width="120" height="40" style={logoStyle} />
        </div>
        <Heading style={h1}>Cerere nouă de închiriere</Heading>
        <Text style={text}>
          <strong>{renterName}</strong> dorește să închirieze <strong>{productTitle}</strong>
          {startDate && endDate ? ` în perioada ${startDate} – ${endDate}` : ''}.
        </Text>
        <Text style={text}>
          Accesează contul tău pentru a accepta sau refuza cererea.
        </Text>
        <Button style={button} href={ctaHref}>
          Vezi cererea
        </Button>
        <Hr style={hr} />
        <Text style={footer}>Cu drag, Echipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
  )
}

export const template = {
  component: RentalRequestOwnerEmail,
  subject: 'Ai primit o cerere nouă de închiriere',
  displayName: 'Cerere nouă (Owner)',
  previewData: { renterName: 'Ion Popescu', productTitle: 'Bicicletă Mountain Bike', startDate: '15 ian 2025', endDate: '18 ian 2025', rentalId: '326efd56-9af7-4af2-a57c-b0cdea56e5dd' },
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
