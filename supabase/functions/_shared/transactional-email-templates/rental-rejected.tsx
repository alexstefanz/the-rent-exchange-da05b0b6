/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Button, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rentli'

interface Props {
  productTitle?: string
  ownerName?: string
}

const RentalRejectedEmail = ({ productTitle = 'produsul solicitat', ownerName = 'Proprietarul' }: Props) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Cererea ta de închiriere a fost refuzată</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}><Heading style={headerTitle}>{SITE_NAME}</Heading></div>
        <Heading style={h1}>Cerere refuzată</Heading>
        <Text style={text}>
          Din păcate, <strong>{ownerName}</strong> a refuzat cererea ta pentru <strong>{productTitle}</strong>.
        </Text>
        <Text style={text}>Nu-ți face griji — poți căuta alte produse similare disponibile pe platformă.</Text>
        <Button style={button} href="https://rentli.ro/search">Caută alte produse</Button>
        <Hr style={hr} />
        <Text style={footer}>Cu drag, Echipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RentalRejectedEmail,
  subject: 'Cererea ta de închiriere a fost refuzată',
  displayName: 'Cerere refuzată',
  previewData: { productTitle: 'Bicicletă Mountain Bike', ownerName: 'Maria Ionescu' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#F59E0B', padding: '20px 25px', borderRadius: '8px 8px 0 0' }
const headerTitle = { color: '#ffffff', fontSize: '20px', fontWeight: 'bold' as const, margin: '0' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#302520', margin: '25px 25px 10px' }
const text = { fontSize: '14px', color: '#7D7471', lineHeight: '1.5', margin: '0 25px 15px' }
const button = { backgroundColor: '#F59E0B', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block', margin: '10px 25px 20px' }
const hr = { borderColor: '#eee', margin: '20px 25px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 25px 25px' }
