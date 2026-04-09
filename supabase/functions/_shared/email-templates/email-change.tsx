/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://tsffyecastudajmgrckt.supabase.co/storage/v1/object/public/email-assets/rentli_logo.png'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Confirmă schimbarea adresei de email pe Rentli</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}>
          <Img src={LOGO_URL} alt="Rentli" width="120" height="40" style={logoStyle} />
        </div>
        <Heading style={h1}>Schimbare adresă de email</Heading>
        <Text style={text}>
          Ai solicitat schimbarea adresei de email pe Rentli de la{' '}
          <Link href={`mailto:${email}`} style={link}>
            {email}
          </Link>{' '}
          la{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>
          Apasă butonul de mai jos pentru a confirma schimbarea:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmă schimbarea
        </Button>
        <Text style={footer}>
          Dacă nu ai solicitat această schimbare, te rugăm să îți securizezi
          contul imediat.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#F59E0B', padding: '20px 25px', borderRadius: '8px 8px 0 0' }
const logoStyle = { display: 'block' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#302520', margin: '25px 25px 10px' }
const text = { fontSize: '14px', color: '#7D7471', lineHeight: '1.5', margin: '0 25px 15px' }
const link = { color: '#F59E0B', textDecoration: 'underline' }
const button = {
  backgroundColor: '#F59E0B',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '12px',
  padding: '12px 24px',
  textDecoration: 'none',
  fontWeight: 'bold' as const,
  margin: '10px 25px 20px',
  display: 'inline-block' as const,
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 25px 25px' }
