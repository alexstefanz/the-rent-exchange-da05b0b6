/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

// ─── Brand tokens ─────────────────────────────────────────────────────────
export const SITE_NAME = 'Rentli'
export const APP_URL = 'https://rentli.ro'
export const LOGO_URL =
  'https://tsffyecastudajmgrckt.supabase.co/storage/v1/object/public/email-assets/rentli_logo.png'
export const SUPPORT_EMAIL = 'support@rentli.ro'

const PRIMARY = '#F59E0B'
const PRIMARY_HOVER = '#F98715'
const INK = '#1A1410'
const MUTED = '#6B6360'
const SUBTLE = '#9C9491'
const CARD_BG = '#FFFFFF'
const PAGE_BG = '#FFFFFF'
const BORDER = '#EFE9E2'
const FONT = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"

// ─── Status tokens ────────────────────────────────────────────────────────
export type StatusKind =
  | 'pending' | 'approved' | 'active' | 'declined' | 'cancelled'
  | 'payment_pending' | 'completed' | 'info'

const STATUS_MAP: Record<StatusKind, { label: string; fg: string; bg: string }> = {
  pending:         { label: 'În așteptare',   fg: '#92400E', bg: '#FEF3C7' },
  approved:        { label: 'Acceptată',       fg: '#166534', bg: '#DCFCE7' },
  active:          { label: 'Activă',          fg: '#166534', bg: '#DCFCE7' },
  declined:        { label: 'Refuzată',        fg: '#991B1B', bg: '#FEE2E2' },
  cancelled:       { label: 'Anulată',         fg: '#991B1B', bg: '#FEE2E2' },
  payment_pending: { label: 'Plată în curs',   fg: '#1E40AF', bg: '#DBEAFE' },
  completed:       { label: 'Finalizată',      fg: '#5B21B6', bg: '#EDE9FE' },
  info:            { label: 'Informare',       fg: '#1F2937', bg: '#F3F4F6' },
}

// ─── Layout ───────────────────────────────────────────────────────────────
const RESPONSIVE_CSS = `
@media (max-width: 620px) {
  .rl-card { width: 100% !important; border-radius: 0 !important; box-shadow: none !important; }
  .rl-pad { padding-left: 22px !important; padding-right: 22px !important; }
  .rl-cta { width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
  .rl-product-img { width: 100% !important; height: auto !important; max-height: 200px !important; border-radius: 12px 12px 0 0 !important; }
  .rl-product-cell { display: block !important; width: 100% !important; }
  .rl-h1 { font-size: 22px !important; }
}
@media (prefers-color-scheme: dark) {
  .rl-page-bg { background-color: #1c1917 !important; }
}
`

export const BaseLayout: React.FC<{ preview: string; children: React.ReactNode }> = ({ preview, children }) => (
  <Html lang="ro" dir="ltr">
    <Head>
      <meta name="color-scheme" content="light" />
      <meta name="supported-color-schemes" content="light" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>{RESPONSIVE_CSS}</style>
    </Head>
    <Preview>{preview}</Preview>
    <Body style={pageBody} className="rl-page-bg">
      <Container style={outer}>
        <div className="rl-card" style={card}>
          <Header />
          <div className="rl-pad" style={cardInner}>
            {children}
          </div>
          <Footer />
        </div>
        <Text style={legalLine}>
          {SITE_NAME} • Marketplace pentru închirieri în România
        </Text>
      </Container>
    </Body>
  </Html>
)

// ─── Header (gradient hero) ───────────────────────────────────────────────
export const Header: React.FC = () => (
  <Section style={header}>
    <Img src={LOGO_URL} alt="Rentli" width="108" height="36" style={logoStyle} />
  </Section>
)

// ─── Typography primitives ────────────────────────────────────────────────
export const H1: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Heading as="h1" style={h1} className="rl-h1">{children}</Heading>
)
export const Lead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={lead}>{children}</Text>
)
export const Para: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={paraStyle}>{children}</Text>
)
export const Muted: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={muted}>{children}</Text>
)
export const Divider: React.FC = () => <Hr style={hr} />

// ─── CTA Button ───────────────────────────────────────────────────────────
export const CTAButton: React.FC<{
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'ghost' | 'danger'
}> = ({ href, children, variant = 'primary' }) => (
  <Section style={{ margin: '6px 0 4px' }}>
    <Button href={href} style={ctaStyle(variant)} className="rl-cta">
      {children}
    </Button>
  </Section>
)

// ─── Status badge ─────────────────────────────────────────────────────────
export const StatusBadge: React.FC<{ kind: StatusKind; label?: string }> = ({ kind, label }) => {
  const s = STATUS_MAP[kind]
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '999px',
      backgroundColor: s.bg,
      color: s.fg,
      fontSize: '12px',
      fontWeight: 700,
      letterSpacing: '0.2px',
      lineHeight: '16px',
    }}>
      {label ?? s.label}
    </span>
  )
}

// ─── Product Card (table-based for Outlook) ───────────────────────────────
export const ProductCard: React.FC<{
  image?: string
  title?: string
  location?: string
  period?: string
  totalPrice?: number | string
  currency?: string
  status?: StatusKind
  statusLabel?: string
}> = ({ image, title, location, period, totalPrice, currency = 'RON', status, statusLabel }) => {
  const fallback = 'https://tsffyecastudajmgrckt.supabase.co/storage/v1/object/public/email-assets/rentli_logo.png'
  const src = image || fallback
  return (
    <table cellPadding={0} cellSpacing={0} role="presentation" style={productCard}>
      <tbody>
        <tr>
          <td className="rl-product-cell" style={productImgCell}>
            <Img
              src={src}
              alt={title || 'Produs'}
              width="104"
              height="104"
              className="rl-product-img"
              style={productImg}
            />
          </td>
          <td className="rl-product-cell" style={productBodyCell}>
            {title && <div style={productTitle}>{title}</div>}
            {location && (
              <div style={productMeta}>
                <span style={pin}>📍</span> {location}
              </div>
            )}
            {period && (
              <div style={productMeta}>
                <span style={pin}>🗓</span> {period}
              </div>
            )}
            {(status || totalPrice !== undefined) && (
              <div style={{ marginTop: '10px', display: 'block' }}>
                {status && <span style={{ marginRight: 8 }}><StatusBadge kind={status} label={statusLabel} /></span>}
                {totalPrice !== undefined && (
                  <span style={priceTag}>
                    {typeof totalPrice === 'number' ? `${totalPrice.toLocaleString('ro-RO')} ${currency}` : `${totalPrice} ${currency}`}
                  </span>
                )}
              </div>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

// ─── Info row (label / value) ─────────────────────────────────────────────
export const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <table cellPadding={0} cellSpacing={0} role="presentation" style={{ width: '100%', margin: '0 0 6px' }}>
    <tbody>
      <tr>
        <td style={{ fontSize: 13, color: MUTED, padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>{label}</td>
        <td style={{ fontSize: 13, color: INK, fontWeight: 600, padding: '8px 0', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' as const }}>{value}</td>
      </tr>
    </tbody>
  </table>
)

// ─── Reason / callout box ────────────────────────────────────────────────
export const ReasonBox: React.FC<{ label?: string; children: React.ReactNode; tone?: 'warn' | 'danger' | 'info' }> = ({ label = 'Motiv', children, tone = 'warn' }) => {
  const palette =
    tone === 'danger' ? { bg: '#FEE2E2', label: '#991B1B', text: '#1A1410' }
    : tone === 'info' ? { bg: '#DBEAFE', label: '#1E40AF', text: '#1A1410' }
    : { bg: '#FEF3C7', label: '#92400E', text: '#1A1410' }
  return (
    <Section style={{ backgroundColor: palette.bg, padding: '14px 16px', borderRadius: 12, margin: '16px 0' }}>
      <Text style={{ fontSize: 11, color: palette.label, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const, margin: '0 0 4px' }}>{label}</Text>
      <Text style={{ fontSize: 14, color: palette.text, margin: 0, lineHeight: '1.5' }}>{children}</Text>
    </Section>
  )
}

// ─── Message preview (chat quote) ────────────────────────────────────────
export const MessagePreview: React.FC<{ children: React.ReactNode; sender?: string }> = ({ children, sender }) => (
  <Section style={messageBox}>
    {sender && <Text style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, margin: '0 0 4px', textTransform: 'uppercase' as const, letterSpacing: '0.4px' }}>{sender}</Text>}
    <Text style={{ fontSize: 15, color: INK, margin: 0, lineHeight: '1.55', fontStyle: 'italic' as const }}>"{children}"</Text>
  </Section>
)

// ─── Avatar (initial circle) ─────────────────────────────────────────────
export const Avatar: React.FC<{ name?: string }> = ({ name }) => {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  return (
    <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_HOVER} 100%)`, color: '#fff', textAlign: 'center', lineHeight: '44px', fontWeight: 700, fontSize: 18, display: 'inline-block' }}>
      {initial}
    </div>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────
const Footer: React.FC = () => (
  <Section style={footerWrap} className="rl-pad">
    <Hr style={{ borderColor: BORDER, margin: '0 0 20px' }} />
    <Text style={footerHelp}>
      Ai nevoie de ajutor?{' '}
      <Link href={`${APP_URL}/suport`} style={footerLink}>Centru suport</Link>
      {' • '}
      <Link href={`mailto:${SUPPORT_EMAIL}`} style={footerLink}>{SUPPORT_EMAIL}</Link>
    </Text>
    <Text style={footerLinks}>
      <Link href={`${APP_URL}/termeni`} style={footerLink}>Termeni</Link>
      {' • '}
      <Link href={`${APP_URL}/confidentialitate`} style={footerLink}>Confidențialitate</Link>
      {' • '}
      <Link href={`${APP_URL}/cum-functioneaza`} style={footerLink}>Cum funcționează</Link>
    </Text>
    <Text style={footerCopy}>
      © {new Date().getFullYear()} {SITE_NAME}. Închiriere securizată între oameni, cu plată blocată în siguranță până la predare.
    </Text>
  </Section>
)

// ─── Styles ───────────────────────────────────────────────────────────────
const pageBody: React.CSSProperties = {
  backgroundColor: PAGE_BG,
  margin: 0,
  padding: '32px 0',
  fontFamily: FONT,
  WebkitFontSmoothing: 'antialiased',
}
const outer: React.CSSProperties = { maxWidth: 600, margin: '0 auto', padding: '0 16px' }
const card: React.CSSProperties = {
  backgroundColor: CARD_BG,
  borderRadius: 18,
  overflow: 'hidden',
  boxShadow: '0 4px 24px rgba(48,37,32,0.06), 0 1px 2px rgba(48,37,32,0.04)',
}
const cardInner: React.CSSProperties = { padding: '32px 36px 8px' }
const header: React.CSSProperties = {
  background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_HOVER} 100%)`,
  padding: '28px 36px',
}
const logoStyle: React.CSSProperties = { display: 'block' }
const h1: React.CSSProperties = { fontSize: 26, lineHeight: 1.25, fontWeight: 800, color: INK, margin: '0 0 14px', letterSpacing: '-0.3px' }
const lead: React.CSSProperties = { fontSize: 16, color: INK, lineHeight: 1.55, margin: '0 0 20px' }
const paraStyle: React.CSSProperties = { fontSize: 15, color: MUTED, lineHeight: 1.6, margin: '0 0 16px' }
const muted: React.CSSProperties = { fontSize: 13, color: SUBTLE, lineHeight: 1.5, margin: '0 0 12px' }
const hr: React.CSSProperties = { borderColor: BORDER, borderTop: `1px solid ${BORDER}`, margin: '20px 0' }

const ctaStyle = (variant: 'primary' | 'ghost' | 'danger'): React.CSSProperties => {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '14px 28px',
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 15,
    textDecoration: 'none',
    letterSpacing: '0.1px',
  }
  if (variant === 'ghost') return { ...base, backgroundColor: '#FFFFFF', color: PRIMARY, border: `1.5px solid ${PRIMARY}` }
  if (variant === 'danger') return { ...base, backgroundColor: '#DC2626', color: '#FFFFFF' }
  return { ...base, backgroundColor: PRIMARY, color: '#FFFFFF', boxShadow: '0 4px 12px rgba(245,158,11,0.25)' }
}

const productCard: React.CSSProperties = {
  width: '100%',
  border: `1px solid ${BORDER}`,
  borderRadius: 16,
  margin: '8px 0 22px',
  backgroundColor: '#FBF8F4',
  borderCollapse: 'separate',
}
const productImgCell: React.CSSProperties = { padding: 14, verticalAlign: 'top' as const, width: 132 }
const productImg: React.CSSProperties = { borderRadius: 12, display: 'block', objectFit: 'cover' as const, backgroundColor: '#EFE9E2' }
const productBodyCell: React.CSSProperties = { padding: '14px 16px 14px 0', verticalAlign: 'top' as const }
const productTitle: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: INK, margin: '2px 0 8px', lineHeight: 1.35 }
const productMeta: React.CSSProperties = { fontSize: 13, color: MUTED, margin: '4px 0', lineHeight: 1.5 }
const pin: React.CSSProperties = { display: 'inline-block', marginRight: 4 }
const priceTag: React.CSSProperties = { fontSize: 14, fontWeight: 800, color: INK, display: 'inline-block', verticalAlign: 'middle' as const }

const messageBox: React.CSSProperties = {
  backgroundColor: '#FBF8F4',
  borderLeft: `3px solid ${PRIMARY}`,
  padding: '14px 18px',
  borderRadius: 10,
  margin: '8px 0 22px',
}

const footerWrap: React.CSSProperties = { padding: '16px 36px 28px', textAlign: 'center' as const }
const footerHelp: React.CSSProperties = { fontSize: 13, color: MUTED, margin: '0 0 8px', lineHeight: 1.5 }
const footerLinks: React.CSSProperties = { fontSize: 12, color: SUBTLE, margin: '0 0 12px' }
const footerLink: React.CSSProperties = { color: PRIMARY, textDecoration: 'none', fontWeight: 600 }
const footerCopy: React.CSSProperties = { fontSize: 11, color: SUBTLE, margin: 0, lineHeight: 1.5 }

const legalLine: React.CSSProperties = { fontSize: 11, color: SUBTLE, textAlign: 'center' as const, margin: '20px 0 0' }

// Re-exports for templates
export { Section, Text, Img, Hr, Link }