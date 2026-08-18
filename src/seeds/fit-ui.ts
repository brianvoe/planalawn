import { NTEP } from '../charts/bars'
import { coverageLabel, fitTier } from '../services/suitability'
import type { BaselineKey, Blend, BlendFit, Coverage, FitMeter, ScoreFactor } from '../types'

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
  amazon: 'Amazon',
} as const

/**
 * What the listing is, in the one slot a card has for it.
 *
 * Sod-only varieties beat the channel label for usefulness: knowing a grass
 * ships as sod or plugs changes the whole project, where "pro shop" does not.
 */
export function formOrChannelLabel(blend: Pick<Blend, 'channel' | 'curated' | 'form'>): string {
  if (blend.form === 'sod') return 'Sod or plugs'
  if (blend.channel) return CHANNEL_LABELS[blend.channel]
  return blend.curated ? 'Curated' : 'Yours'
}

/**
 * The class that shades a score badge, from the same ladder that words it.
 *
 * An unscored bag gets its own class rather than the bottom step: the pages
 * draw it neutral and dashed, because a bag we could not score is not a bag
 * that scored badly (README design principle 4).
 */
export function fitTone(score: number | null | undefined): string {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'unk'
  return fitTier(score).tone
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

/**
 * A rating's share of the full 1-9 NTEP scale.
 *
 * Bars keep the real scale instead of stretching to the spread of whatever is
 * on screen: a 6.4 and a 6.8 really are close, and a zoomed axis would sell a
 * difference the trial does not support (design principle 2).
 */
export function ratingWidth(value: number | null | undefined): string {
  if (typeof value !== 'number') return '0%'
  const clamped = Math.min(NTEP.max, Math.max(NTEP.min, value))
  return `${((clamped - NTEP.min) / (NTEP.max - NTEP.min)) * 100}%`
}

function withBaseline(meter: FitMeter, baseline: number | undefined): FitMeter {
  if (baseline == null) return meter
  const side = meter.value >= baseline ? 'above' : 'below'
  return {
    ...meter,
    baseline,
    hint: `${meter.hint} ${fmtRating(meter.value)} vs a ${fmtRating(baseline)} trial average — ${side} it, though gaps under about half a point are inside trial noise.`,
  }
}

/**
 * The three traits people actually choose a bag on: how it handles dry spells,
 * how it handles disease, and how dark it is.
 *
 * All three read from the blend's trial averages rather than from the score,
 * so the row matches the trait chart on the detail page. Drought and brown
 * patch are deliberately shown apart instead of as the score's combined
 * summerStress, which would have put a number beside half of itself. A row is
 * dropped rather than zeroed when its table is missing, so an absent metric
 * never reads as a bad one; what each number means lives in the row's hint.
 */
export function fitMeters(
  fit: BlendFit | null | undefined,
  baselines: Partial<Record<BaselineKey, number>> = {},
): FitMeter[] {
  if (!fit || fit.score == null) return []
  const averages = fit.averages
  const meters: FitMeter[] = []

  if (averages?.drought != null) {
    meters.push(
      withBaseline(
        {
          key: 'drought',
          // Short enough for three columns on a phone; the hint carries the rest.
          label: 'Drought',
          value: averages.drought,
          hint: 'Turf quality held through the trial’s drought plots. Higher stays green longer between waterings.',
        },
        baselines.drought,
      ),
    )
  }
  if (averages?.brownPatch != null) {
    meters.push(
      withBaseline(
        {
          key: 'brownPatch',
          label: 'Brown patch',
          value: averages.brownPatch,
          hint: 'Resistance to the disease its trial tracked — brown patch on fescue, large patch or spring dead spot on warm-season grasses. Higher means less damage.',
        },
        baselines.brownPatch,
      ),
    )
  }
  if (averages?.color != null) {
    meters.push(
      withBaseline(
        {
          key: 'color',
          label: 'Color',
          value: averages.color,
          hint: 'Genetic color rating. Higher is a darker green without extra nitrogen.',
        },
        baselines.color,
      ),
    )
  }
  return meters
}
