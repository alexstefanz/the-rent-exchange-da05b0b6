/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { BaseLayout, H1, Lead, Para, Text } from '../transactional-email-templates/_components.tsx'

interface Props { token: string }

const otpBox: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: 34, fontWeight: 800, color: '#1A1410',
  backgroundColor: '#FBF8F4', border: '1px solid #EFE9E2', borderRadius: 14,
  padding: '20px 16px', textAlign: 'center' as const, letterSpacing: 8, margin: '4px 0 22px',
}

export const ReauthenticationEmail = ({ token }: Props) => (
  <BaseLayout preview={`Codul tău de verificare Rentli: ${token}`}>
    <H1>Cod de verificare</H1>
    <Lead>Folosește codul de mai jos pentru a-ți confirma identitatea pe Rentli:</Lead>
    <Text style={{ fontSize: 14, color: '#6B6360', margin: '0 0 8px', textTransform: 'uppercase' as const, letterSpacing: '0.6px', fontWeight: 700 }}>Codul tău</Text>
    <div style={otpBox}>{token}</div>
    <Para>Codul expiră în câteva minute. Dacă nu ai cerut tu acest cod, poți ignora acest email.</Para>
  </BaseLayout>
)

export default ReauthenticationEmail
