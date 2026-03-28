/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Resetează parola pentru Rentli</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Resetare parolă</Heading>
        <Text style={text}>
          Am primit o cerere de resetare a parolei contului tău Rentli.
          Apasă butonul de mai jos pentru a alege o parolă nouă.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Resetează parola
        </Button>
        <Text style={footer}>
          Dacă nu ai solicitat resetarea parolei, poți ignora acest email.
          Parola ta nu va fi modificată.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
