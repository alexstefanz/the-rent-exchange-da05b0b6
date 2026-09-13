/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { BaseLayout, H1, Lead, Para, CTAButton, ReasonBox } from '../transactional-email-templates/_components.tsx'

interface Props { siteName: string; confirmationUrl: string }

export const RecoveryEmail = ({ confirmationUrl }: Props) => (
  <BaseLayout preview="Resetează parola contului tău Rentli">
    <H1>🔒 Resetare parolă</H1>
    <Lead>
      Am primit o cerere de resetare a parolei contului tău. Apasă butonul de mai jos
      pentru a alege o parolă nouă. Linkul expiră în 60 de minute.
    </Lead>
    <CTAButton href={confirmationUrl}>Resetează parola</CTAButton>
    <ReasonBox label="Nu ai cerut tu această resetare?" tone="info">
      Ignoră acest email — parola ta rămâne neschimbată.
    </ReasonBox>
    <Para>Pentru securitate, recomandăm o parolă unică, folosită doar pe Rentli.</Para>
  </BaseLayout>
)

export default RecoveryEmail
