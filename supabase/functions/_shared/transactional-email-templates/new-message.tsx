/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Button, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rentli'

interface Props {
  senderName?: string
  productTitle?: string
  messagePreview?: string
}

const NewMessageEmail = ({ senderName = 'Un utilizator', productTitle, messagePreview }: Props) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Ai primit un mesaj nou pe {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}><Heading style={headerTitle}>{SITE_NAME}</Heading></div>
        <Heading style={h1}>Mesaj nou</Heading>
        <Text style={text}>
          <strong>{senderName}</strong> ți-a trimis un mesaj
          {productTitle ? ` despre ${productTitle}` : ''}.
        </Text>
        {messagePreview && <Text style={quoteStyle}>"{messagePreview}"</Text>}
        <Button style={button} href="https://rentli.ro/messages">Răspunde</Button>
        <Hr style={hr} />
        <Text style={footer}>Cu drag, Echipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewMessageEmail,
  subject: 'Ai primit un mesaj nou pe Rentli',
  displayName: 'Mesaj nou',
  previewData: { senderName: 'Ion Popescu', productTitle: 'Bicicletă Mountain Bike', messagePreview: 'Bună! Este disponibilă weekendul acesta?' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#F59E0B', padding: '20px 25px', borderRadius: '8px 8px 0 0' }
const headerTitle = { color: '#ffffff', fontSize: '20px', fontWeight: 'bold' as const, margin: '0' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#302520', margin: '25px 25px 10px' }
const text = { fontSize: '14px', color: '#7D7471', lineHeight: '1.5', margin: '0 25px 15px' }
const quoteStyle = { fontSize: '14px', color: '#302520', lineHeight: '1.5', margin: '0 25px 15px', padding: '12px 16px', backgroundColor: '#FAF9F7', borderLeft: '3px solid #F59E0B', borderRadius: '4px' }
const button = { backgroundColor: '#F59E0B', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block', margin: '10px 25px 20px' }
const hr = { borderColor: '#eee', margin: '20px 25px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 25px 25px' }
