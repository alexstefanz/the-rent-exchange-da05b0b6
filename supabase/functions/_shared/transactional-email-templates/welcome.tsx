/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rentli'
const LOGO_URL = 'https://tsffyecastudajmgrckt.supabase.co/storage/v1/object/public/email-assets/rentli_logo.png'

interface WelcomeEmailProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Bine ai venit pe {SITE_NAME}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}>
          <Img src={LOGO_URL} alt="Rentli" width="120" height="40" style={logoStyle} />
        </div>
        <Heading style={h1}>
          {name ? `Bine ai venit, ${name}!` : 'Bine ai venit pe Rentli!'}
        </Heading>
        <Text style={text}>
          Suntem bucuroși că te-ai alăturat comunității Rentli. Acum poți
          închiria și oferi spre închiriere orice obiect, simplu și sigur.
        </Text>
        <Text style={text}>
          Explorează categoriile disponibile și găsește exact ce ai nevoie!
        </Text>
        <Hr style={hr} />
        <Text style={footer}>Cu drag, Echipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Bine ai venit pe Rentli! 🎉',
  displayName: 'Welcome email',
  previewData: { name: 'Maria' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#F59E0B', padding: '20px 25px', borderRadius: '8px 8px 0 0' }
const logoStyle = { display: 'block' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#302520', margin: '25px 25px 10px' }
const text = { fontSize: '14px', color: '#7D7471', lineHeight: '1.5', margin: '0 25px 15px' }
const hr = { borderColor: '#eee', margin: '20px 25px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 25px 25px' }
