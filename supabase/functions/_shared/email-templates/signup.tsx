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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Confirmă adresa de email pentru Rentli</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}>
          <Img src={LOGO_URL} alt="Rentli" width="120" height="40" style={logoStyle} />
        </div>
        <Heading style={h1}>Bine ai venit pe Rentli! 🎉</Heading>
        <Text style={text}>
          Mulțumim că te-ai înregistrat pe{' '}
          <Link href={siteUrl} style={link}>
            <strong>Rentli</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          Te rugăm să confirmi adresa ta de email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) apăsând butonul de mai jos:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmă adresa de email
        </Button>
        <Text style={footer}>
          Dacă nu ai creat un cont pe Rentli, poți ignora acest email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#F59E0B', padding: '20px 25px', borderRadius: '8px 8px 0 0' }
const logoStyle = { display: 'block' as const }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#302520',
  margin: '25px 25px 10px',
}
const text = {
  fontSize: '14px',
  color: '#7D7471',
  lineHeight: '1.5',
  margin: '0 25px 15px',
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
  margin: '10px 25px 20px',
  display: 'inline-block' as const,
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 25px 25px' }
