/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { BaseLayout, H1, Lead, Para, CTAButton } from '../transactional-email-templates/_components.tsx'

interface Props { siteName: string; confirmationUrl: string }

export const MagicLinkEmail = ({ confirmationUrl }: Props) => (
  <BaseLayout preview="Link de autentificare Rentli">
    <H1>🔑 Link de autentificare</H1>
    <Lead>Apasă butonul de mai jos pentru a te autentifica instant pe Rentli. Linkul expiră în câteva minute.</Lead>
    <CTAButton href={confirmationUrl}>Autentifică-te</CTAButton>
    <Para>Dacă nu ai cerut tu acest link, poți ignora acest email — contul tău rămâne în siguranță.</Para>
  </BaseLayout>
)

export default MagicLinkEmail
