/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { BaseLayout, H1, Lead, Para, CTAButton, InfoRow } from '../transactional-email-templates/_components.tsx'

interface Props { siteName: string; email: string; newEmail: string; confirmationUrl: string }

export const EmailChangeEmail = ({ email, newEmail, confirmationUrl }: Props) => (
  <BaseLayout preview="Confirmă schimbarea adresei de email pe Rentli">
    <H1>Confirmă schimbarea emailului</H1>
    <Lead>Ai solicitat schimbarea adresei de email asociate contului tău Rentli.</Lead>
    <InfoRow label="De la" value={email} />
    <InfoRow label="La" value={newEmail} />
    <div style={{ marginTop: 18 }}>
      <CTAButton href={confirmationUrl}>Confirmă schimbarea</CTAButton>
    </div>
    <Para>Dacă nu ai cerut tu această modificare, securizează-ți contul imediat.</Para>
  </BaseLayout>
)

export default EmailChangeEmail
