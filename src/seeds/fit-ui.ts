import { NTEP } from '../charts/bars'
import { coverageLabel } from '../services/suitability'
import type { Blend, BlendFit, Coverage, FitMeter, ScoreFactor } from '../types'

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
 * The few numbers that answer "why this bag, here" at a glance.
 *
 * Ordered by how much they drive the score, and each row is dropped rather
 * than zeroed when its table is missing, so an absent metric never reads as a
 * bad one. Only the site name is shortened to a city — the full name and what
 * the number means live in the row's hint.
 */
export function fitMeters(
  fit: BlendFit | null | undefined,
  baselines: Partial<Record<ScoreFactor, number>> = {},
  regional = false,
): FitMeter[] {
  if (!fit || fit.score == null) return []
  const factors = fit.factors || {}
  const meters: FitMeter[] = []
  const site = fit.nearestSite
  const area = factors.nearest ?? factors.region ?? factors.national

  if (area != null) {
    meters.push(
      withBaseline(
        {
          key: 'area',
          // With no site to name, say which average stood in for it rather than
          // implying a local number we don't have.
          label: site ? `Near ${site.name.split(',')[0]}` : regional ? 'Regional' : 'National',
          value: area,
          hint: site
            ? `Turf quality at ${site.name}, the closest trial site with plots for this seed.`
            : regional
              ? 'Turf quality averaged over the trial sites in your climate band.'
              : 'Turf quality averaged over every site in the trial.',
        },
        baselines.nearest ?? baselines.region ?? baselines.national,
      ),
    )
  }
  if (factors.summerStress != null) {
    meters.push(
      withBaseline(
        {
          key: 'summerStress',
          // Short enough for three columns on a phone; the hint carries the rest.
          label: 'Summer',
          value: factors.summerStress,
          hint: 'Drought quality and brown patch resistance, averaged. Higher holds up better through summer.',
        },
        baselines.summerStress,
      ),
    )
  }
  const color = factors.color ?? fit.averages?.color
  if (color != null) {
    meters.push(
      withBaseline(
        {
          key: 'color',
          label: 'Color',
          value: color,
          hint: 'Genetic color rating. Higher is a darker green without extra nitrogen.',
        },
        baselines.color,
      ),
    )
  }
  return meters
}
