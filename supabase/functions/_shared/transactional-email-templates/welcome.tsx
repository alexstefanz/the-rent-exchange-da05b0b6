/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, CTAButton, APP_URL, Section, Text } from './_components.tsx'

interface Props { name?: string }

const tile = { backgroundColor: '#FBF8F4', borderRadius: 14, padding: '18px 16px', textAlign: 'center' as const, border: '1px solid #EFE9E2' }
const tileTitle = { fontSize: 14, fontWeight: 700, color: '#1A1410', margin: '8px 0 4px' }
const tileText = { fontSize: 12, color: '#6B6360', margin: 0, lineHeight: 1.5 }

const WelcomeEmail = ({ name }: Props) => (
  <BaseLayout preview={`Bine ai venit pe Rentli${name ? `, ${name}` : ''}!`}>
    <H1>{name ? `Bine ai venit, ${name} 👋` : 'Bine ai venit pe Rentli 👋'}</H1>
    <Lead>
      Suntem bucuroși că te-ai alăturat comunității. Pe Rentli poți închiria sau pune
      la închiriere orice obiect, simplu, sigur și cu plată blocată în siguranță până la predare.
    </Lead>
    <table cellPadding={0} cellSpacing={8} role="presentation" style={{ width: '100%', margin: '12px 0 24px' }}>
      <tbody>
        <tr>
          <td style={tile}><div style={{ fontSize: 22 }}>🔍</div><div style={tileTitle}>Caută</div><Text style={tileText}>Mii de produse</Text></td>
          <td style={tile}><div style={{ fontSize: 22 }}>📦</div><div style={tileTitle}>Listează</div><Text style={tileText}>Câștigă din lucrurile tale</Text></td>
          <td style={tile}><div style={{ fontSize: 22 }}>💬</div><div style={tileTitle}>Discută</div><Text style={tileText}>Chat sigur, în-app</Text></td>
        </tr>
      </tbody>
    </table>
    <CTAButton href={APP_URL}>Explorează platforma</CTAButton>
    <Para>Dacă ai întrebări, suntem la un click distanță.</Para>
  </BaseLayout>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Bine ai venit pe Rentli! 🎉',
  displayName: 'Welcome email',
  previewData: { name: 'Maria' },
} satisfies TemplateEntry
