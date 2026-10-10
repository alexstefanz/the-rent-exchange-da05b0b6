/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { BaseLayout, H1, Lead, Para, CTAButton } from '../transactional-email-templates/_components.tsx'

interface Props { siteName: string; siteUrl: string; confirmationUrl: string }

export const InviteEmail = ({ confirmationUrl }: Props) => (
  <BaseLayout preview="Ai fost invitat pe Rentli">
    <H1>Ai fost invitat pe Rentli ✨</H1>
    <Lead>
      Cineva te-a invitat să te alături comunității Rentli — marketplace-ul de
      închirieri între oameni cu plată blocată în siguranță până la predare. Apasă pentru a-ți activa contul.
    </Lead>
    <CTAButton href={confirmationUrl}>Acceptă invitația</CTAButton>
    <Para>Dacă nu așteptai această invitație, poți ignora acest email.</Para>
  </BaseLayout>
)

export default InviteEmail
