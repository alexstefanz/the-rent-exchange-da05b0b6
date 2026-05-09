/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { BaseLayout, H1, Lead, Para, MessagePreview, CTAButton, APP_URL, Section, Text } from './_components.tsx'

interface Props {
  reviewerName?: string
  rating?: number
  comment?: string
}

const stars = (n: number) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n)

const ReviewReceivedEmail = (p: Props) => {
  const rating = Math.max(0, Math.min(5, p.rating ?? 5))
  return (
    <BaseLayout preview={`${p.reviewerName ?? 'Cineva'} ți-a lăsat o recenzie`}>
      <H1>Ai primit o recenzie nouă ⭐</H1>
      <Lead><strong>{p.reviewerName ?? 'Un utilizator'}</strong> ți-a lăsat o evaluare:</Lead>
      <Section style={{ textAlign: 'center' as const, padding: '6px 0 14px' }}>
        <Text style={{ fontSize: 32, color: '#F59E0B', letterSpacing: 4, margin: 0 }}>{stars(rating)}</Text>
        <Text style={{ fontSize: 13, color: '#6B6360', margin: '4px 0 0' }}>{rating} din 5</Text>
      </Section>
      {p.comment && <MessagePreview sender={p.reviewerName}>{p.comment}</MessagePreview>}
      <CTAButton href={`${APP_URL}/profile`}>Vezi recenzia</CTAButton>
      <Para>Recenziile autentice te ajută să primești mai multe rezervări.</Para>
    </BaseLayout>
  )
}

export const template = {
  component: ReviewReceivedEmail,
  subject: 'Ai primit o recenzie nouă ⭐',
  displayName: 'Recenzie primită',
  previewData: { reviewerName: 'Maria Ionescu', rating: 5, comment: 'Experiență excelentă, recomand cu încredere!' },
} satisfies TemplateEntry
