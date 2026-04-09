/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Button, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rentli'

interface Props {
  confirmationLink?: string
}

const AccountDeactivationEmail = ({ confirmationLink = '#' }: Props) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Confirmare dezactivare cont {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}><Heading style={headerTitle}>{SITE_NAME}</Heading></div>
        <Heading style={h1}>Dezactivare cont</Heading>
        <Text style={text}>
          Ai solicitat dezactivarea contului tău Rentli. Apasă butonul de mai jos pentru a confirma.
        </Text>
        <Text style={text}>
          Dacă nu ai făcut tu această solicitare, poți ignora acest email.
        </Text>
        <Button style={button} href={confirmationLink}>Confirmă dezactivarea</Button>
        <Hr style={hr} />
        <Text style={footer}>Cu drag, Echipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AccountDeactivationEmail,
  subject: 'Confirmare dezactivare cont Rentli',
  displayName: 'Dezactivare cont',
  previewData: { confirmationLink: 'https://rentli.ro/confirm-deactivation?token=abc123' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#F59E0B', padding: '20px 25px', borderRadius: '8px 8px 0 0' }
const headerTitle = { color: '#ffffff', fontSize: '20px', fontWeight: 'bold' as const, margin: '0' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#302520', margin: '25px 25px 10px' }
const text = { fontSize: '14px', color: '#7D7471', lineHeight: '1.5', margin: '0 25px 15px' }
const button = { backgroundColor: '#dc2626', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block', margin: '10px 25px 20px' }
const hr = { borderColor: '#eee', margin: '20px 25px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 25px 25px' }
