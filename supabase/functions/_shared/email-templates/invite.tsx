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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Ai fost invitat pe Rentli</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Ai fost invitat!</Heading>
        <Text style={text}>
          Ai primit o invitație să te alături platformei{' '}
          <Link href={siteUrl} style={link}>
            <strong>Rentli</strong>
          </Link>
          . Apasă butonul de mai jos pentru a accepta invitația și a-ți crea contul.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Acceptă invitația
        </Button>
        <Text style={footer}>
          Dacă nu te așteptai la această invitație, poți ignora acest email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
