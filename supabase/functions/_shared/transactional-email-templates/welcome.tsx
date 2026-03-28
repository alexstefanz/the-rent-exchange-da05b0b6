/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rentli'

interface WelcomeEmailProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Bine ai venit pe {SITE_NAME}!</Preview>
    <Body style={main}>
      <Container style={container}>
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
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#302520',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#7D7471',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
