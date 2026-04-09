/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Img, Preview, Text, Button, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rentli'
const LOGO_URL = 'https://tsffyecastudajmgrckt.supabase.co/storage/v1/object/public/email-assets/rentli_logo.png'

interface Props {
  reviewerName?: string
  rating?: number
  comment?: string
}

const ReviewReceivedEmail = ({ reviewerName = 'Un utilizator', rating, comment }: Props) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Ai primit o recenzie nouă pe {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}><Img src={LOGO_URL} alt="Rentli" width="120" height="40" style={logoStyle} /></div>
        <Heading style={h1}>Recenzie nouă primită</Heading>
        <Text style={text}>
          <strong>{reviewerName}</strong> ți-a lăsat o recenzie{rating ? ` — ${rating} ⭐` : ''}.
        </Text>
        {comment && <Text style={quoteStyle}>"{comment}"</Text>}
        <Button style={button} href="https://rentli.ro/profile">Vezi recenziile</Button>
        <Hr style={hr} />
        <Text style={footer}>Cu drag, Echipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ReviewReceivedEmail,
  subject: 'Ai primit o recenzie nouă ⭐',
  displayName: 'Recenzie primită',
  previewData: { reviewerName: 'Maria Ionescu', rating: 5, comment: 'Experiență excelentă, recomand cu încredere!' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#F59E0B', padding: '20px 25px', borderRadius: '8px 8px 0 0' }
const logoStyle = { display: 'block' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#302520', margin: '25px 25px 10px' }
const text = { fontSize: '14px', color: '#7D7471', lineHeight: '1.5', margin: '0 25px 15px' }
const quoteStyle = { fontSize: '14px', color: '#302520', lineHeight: '1.5', margin: '0 25px 15px', padding: '12px 16px', backgroundColor: '#FAF9F7', borderLeft: '3px solid #F59E0B', borderRadius: '4px' }
const button = { backgroundColor: '#F59E0B', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block', margin: '10px 25px 20px' }
const hr = { borderColor: '#eee', margin: '20px 25px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 25px 25px' }
