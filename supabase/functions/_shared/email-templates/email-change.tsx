/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

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
const link = { color: '#F59E0B', textDecoration: 'underline' }
const button = {
  backgroundColor: '#F59E0B',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '12px',
  padding: '12px 24px',
  textDecoration: 'none',
  fontWeight: 'bold' as const,
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
