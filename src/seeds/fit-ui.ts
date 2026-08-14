import { coverageLabel } from '../services/suitability'
import type { Coverage, ScoreFactor } from '../types'

export const FACTOR_LABELS: Record<ScoreFactor, string> = {
  nearest: 'Nearest trial site',
  region: 'Regional quality',
  summerStress: 'Drought / brown patch',
  color: 'Genetic color',
  national: 'National mean',
}

export const CHANNEL_LABELS = {
  retail: 'Box store',
  pro: 'Pro shop',
  specialty: 'Specialty seed',
} as const

export function fitTone(score: number | null | undefined): string {
  if (score == null) return 'unk'
  if (score >= 6.6) return 'great'
  if (score >= 6.2) return 'good'
  if (score >= 5.8) return 'ok'
  return 'low'
}

export function coverageTitle(coverage: Coverage | null | undefined): string {
  if (!coverage) return ''
  if (coverage.complete) return 'Scored on all five factors.'
  const missing = coverage.missing.map((k) => FACTOR_LABELS[k] || k).join(', ')
  return `Scored on ${coverageLabel(coverage)}. No trial data for: ${missing}.`
}

export function fmtRating(value: number | null | undefined): string {
  return typeof value === 'number' ? value.toFixed(1) : '—'
}
