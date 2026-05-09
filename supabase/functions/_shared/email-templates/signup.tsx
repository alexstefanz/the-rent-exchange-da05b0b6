/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { BaseLayout, H1, Lead, Para, CTAButton, Section, Text, Link } from '../transactional-email-templates/_components.tsx'

interface Props {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  token?: string
}

const otpBox: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: 34,
  fontWeight: 800,
  color: '#1A1410',
  backgroundColor: '#FBF8F4',
  border: '1px solid #EFE9E2',
  borderRadius: 14,
  padding: '20px 16px',
  textAlign: 'center' as const,
  letterSpacing: 8,
  margin: '4px 0 22px',
}

export const SignupEmail = ({ recipient, confirmationUrl, token }: Props) => (
  <BaseLayout preview={token ? `Codul tău Rentli: ${token}` : 'Confirmă adresa de email pentru Rentli'}>
    <H1>Bine ai venit pe Rentli! 🎉</H1>
    <Lead>
      Mulțumim că ți-ai creat un cont. Confirmă adresa <strong>{recipient}</strong> pentru a începe.
    </Lead>
    {token ? (
      <>
        <Text style={{ fontSize: 14, color: '#6B6360', margin: '0 0 8px', textTransform: 'uppercase' as const, letterSpacing: '0.6px', fontWeight: 700 }}>Codul tău</Text>
        <div style={otpBox}>{token}</div>
        <Para>Codul expiră în câteva minute. Dacă nu ai cerut tu acest cod, ignoră acest email.</Para>
      </>
    ) : (
      <>
        <CTAButton href={confirmationUrl}>Confirmă adresa</CTAButton>
        <Para>Dacă nu ai creat un cont, poți ignora acest email.</Para>
      </>
    )}
  </BaseLayout>
)

export default SignupEmail
