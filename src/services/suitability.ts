import sites from '../data/ntep/sites.json'
import { climateBands, climateBandFromLat } from '../data/climate'
import type {
  Blend,
  BlendComponentFit,
  BlendFit,
  BaselineKey,
  Coverage,
  Cultivar,
  CultivarFit,
  NearbySite,
  NtepSite,
  ScoreFactor,
  ScorePart,
  UserLocation,
} from '../types'

const ntepSites = sites as Record<string, NtepSite>

/**
 * The four steps a fit score is reported in, best first.
 *
 * One ladder for the whole app. The word on a badge and the color behind it
 * both read from here, so a boundary can never move for the wording and leave
 * the shading a step behind — which matters now that the color carries the
 * ranking on its own in the cultivar table. `tone` is the class the seed pages
 * style; a score of null is not a step here, and is handled where it arises.
 */
export const FIT_TIERS = [
  { min: 6.6, word: 'Excellent', tone: 'great' },
  { min: 6.2, word: 'Good', tone: 'good' },
  { min: 5.8, word: 'Moderate', tone: 'ok' },
  { min: -Infinity, word: 'Challenging', tone: 'low' },
] as const

export type FitTier = (typeof FIT_TIERS)[number]

/** The step a score lands on. The last step is open-ended, so this never fails. */
export function fitTier(score: number): FitTier {
  return FIT_TIERS.find((tier) => score >= tier.min) ?? FIT_TIERS[FIT_TIERS.length - 1]
}

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(bLat - aLat)
  const dLon = toRad(bLon - aLon)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Nearest trial sites to a point, optionally restricted to a set of site codes.
 *
 * Restricting is what makes "nearest" meaningful: each metric was measured at
 * its own subset of the trial's locations, so the globally closest site usually
 * has no value for the metric being read. Ranking over all sites would name a
 * site the numbers don't come from. Passing an empty array yields no sites,
 * which is different from passing null (all sites).
 */
export function nearestNtepSites(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  limit = 3,
  codes: string[] | null = null,
): NearbySite[] {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return []
  const allowed = codes ? new Set(codes) : null
  return Object.entries(ntepSites)
    .filter(([code]) => !allowed || allowed.has(code))
    .map(([code, site]) => ({
      code,
      ...site,
      distanceKm: haversineKm(latitude, longitude, site.lat, site.lon),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
}

export function resolveUserClimate(userLocation: UserLocation | null | undefined) {
  if (!userLocation) return null
  const bandId = userLocation.climateBand || climateBandFromLat(userLocation.latitude)?.id
  return bandId ? climateBands[bandId] : null
}

/**
 * The five factors a complete score is built from. Used to report coverage.
 */
export const SCORE_FACTORS: ScoreFactor[] = ['nearest', 'region', 'summerStress', 'color', 'national']

function describeCoverage(parts: ScorePart[]): Coverage {
  const weight = parts.reduce((s, p) => s + p.weight, 0)
  return {
    factors: parts.length,
    totalFactors: SCORE_FACTORS.length,
    missing: SCORE_FACTORS.filter((f) => !parts.some((p) => p.key === f)),
    weight: Number(weight.toFixed(2)),
    complete: parts.length === SCORE_FACTORS.length,
  }
}

/** Short human label for a coverage object, e.g. "2 of 5 factors". */
export function coverageLabel(coverage: Coverage | null | undefined): string {
  if (!coverage) return ''
  return `${coverage.factors} of ${coverage.totalFactors} factors`
}

/** Regional quality tables cover transition and warm-season trial sites. */
export function usesRegionalQuality(climateId: string | null | undefined): boolean {
  return climateId === 'transition' || climateId === 'warm'
}

const FIT_TIE_BAND = 0.15

/**
 * Sort key for "best for my area". Subtracting a fixed amount for incomplete
 * coverage keeps the comparison a total order — a tolerance-based comparator
 * would be non-transitive and give Array.prototype.sort inconsistent results.
 *
 * This orders results only; the score shown to the user is never adjusted.
 */
export function fitRank(fit: CultivarFit | BlendFit | null | undefined): number {
  if (!fit || fit.score == null) return -1
  return fit.score - (fit.coverage?.complete ? 0 : FIT_TIE_BAND)
}

/**
 * Weighted suitability for a cultivar given user location.
 */
export function scoreCultivarForLocation(
  cultivar: Cultivar,
  userLocation: UserLocation | null | undefined,
): CultivarFit {
  const metrics = cultivar.metrics || {}
  const nearest = nearestNtepSites(
    userLocation?.latitude,
    userLocation?.longitude,
    1,
    Object.keys(metrics.transitionQuality?.bySite || {}),
  )[0]
  const climate = resolveUserClimate(userLocation)

  const parts: ScorePart[] = []
  const regional = usesRegionalQuality(climate?.id)

  let nearestScore: number | null = null
  let readFromSite = false
  if (nearest && metrics.transitionQuality?.bySite?.[nearest.code] != null) {
    nearestScore = metrics.transitionQuality.bySite[nearest.code]
    readFromSite = true
  } else if (metrics.knoxvilleQuality?.mean != null && regional) {
    nearestScore = metrics.knoxvilleQuality.mean
  } else if (metrics.transitionQuality?.mean != null && regional) {
    nearestScore = metrics.transitionQuality.mean
  } else if (metrics.nationalMeanQuality?.mean != null) {
    nearestScore = metrics.nationalMeanQuality.mean
  }
  if (nearestScore != null) parts.push({ key: 'nearest', weight: 0.35, value: nearestScore })

  let regionScore: number | null = null
  if (regional && metrics.transitionQuality?.mean != null) {
    regionScore = metrics.transitionQuality.mean
  } else if (metrics.nationalMeanQuality?.mean != null) {
    regionScore = metrics.nationalMeanQuality.mean
  }
  if (regionScore != null) parts.push({ key: 'region', weight: 0.25, value: regionScore })

  const drought = metrics.droughtQuality?.mean
  const brown = metrics.brownPatch?.mean
  const stressVals = [drought, brown].filter((v): v is number => typeof v === 'number')
  if (stressVals.length) {
    parts.push({
      key: 'summerStress',
      weight: 0.2,
      value: stressVals.reduce((a, b) => a + b, 0) / stressVals.length,
    })
  }

  if (metrics.geneticColor?.mean != null) {
    parts.push({ key: 'color', weight: 0.1, value: metrics.geneticColor.mean })
  }
  if (metrics.nationalMeanQuality?.mean != null) {
    parts.push({ key: 'national', weight: 0.1, value: metrics.nationalMeanQuality.mean })
  }

  if (!parts.length) {
    return {
      score: null,
      label: 'Insufficient NTEP overlap',
      parts: [],
      coverage: describeCoverage([]),
      nearestSite: null,
      climate,
    }
  }

  const weightSum = parts.reduce((s, p) => s + p.weight, 0)
  const score = parts.reduce((s, p) => s + p.value * (p.weight / weightSum), 0)

  return {
    score: Number(score.toFixed(2)),
    label: `${fitTier(score).word} fit`,
    parts,
    coverage: describeCoverage(parts),
    nearestSite: readFromSite ? nearest : null,
    climate,
  }
}

type ScoredComponent = BlendComponentFit & {
  cultivar: Cultivar
  fit: CultivarFit & { score: number }
}

/**
 * How much each scored cultivar counts toward the bag.
 *
 * Published percentages when the whole tag lists them, otherwise even weight —
 * guessing a split would invent a number the bag never printed. Weights always
 * sum to 1 so callers can use them for the score and for any single factor.
 */
function componentWeights(scored: ScoredComponent[]): number[] {
  const total = scored.every((c) => typeof c.percent === 'number')
    ? scored.reduce((s, c) => s + (c.percent || 0), 0)
    : 0
  if (!total) return scored.map(() => 1 / scored.length)
  return scored.map((c) => (c.percent || 0) / total)
}

/**
 * Weighted mean of one score factor over the cultivars that report it.
 *
 * Renormalizing on the reporting cultivars keeps a partially covered blend on
 * the same 1-9 scale as a fully covered one, so a missing table reads as less
 * certainty rather than as a worse number (design principle 4).
 */
function factorMean(
  scored: ScoredComponent[],
  weights: number[],
  key: ScoreFactor,
): number | null {
  let sum = 0
  let weight = 0
  scored.forEach((c, i) => {
    const part = c.fit.parts.find((p) => p.key === key)
    if (!part) return
    sum += part.value * weights[i]
    weight += weights[i]
  })
  return weight ? Number((sum / weight).toFixed(2)) : null
}

/**
 * The trial site behind the nearest-site factor, when every cultivar read the
 * same one. Mixed-species bags draw from trials with different location lists,
 * and naming one of them would credit the blend's number to the wrong plot.
 */
function sharedNearestSite(scored: ScoredComponent[]): NearbySite | null {
  const sites = scored.map((c) => c.fit.nearestSite).filter((s): s is NearbySite => s != null)
  if (sites.length !== scored.length) return null
  return sites.every((s) => s.code === sites[0].code) ? sites[0] : null
}

/**
 * Mean of each score factor over every entry in a trial.
 *
 * This is the "average entry" mark on a rating bar. Ratings crowd into a point
 * or two of the 1-9 scale, so an honest full-scale bar looks the same for a
 * strong bag and a weak one; the mark is what makes the bar readable without
 * zooming the axis into fake drama (design principle 2).
 *
 * Experimental entry codes count here on purpose: this is what the plots
 * produced, not a shortlist of what a dealer will sell you.
 */
export function factorBaselines(
  cultivars: Cultivar[],
  userLocation: UserLocation | null | undefined,
): Partial<Record<BaselineKey, number>> {
  const sums = {} as Record<ScoreFactor, { sum: number; count: number }>
  SCORE_FACTORS.forEach((key) => {
    sums[key] = { sum: 0, count: 0 }
  })
  cultivars.forEach((c) => {
    scoreCultivarForLocation(c, userLocation).parts.forEach((p) => {
      sums[p.key].sum += p.value
      sums[p.key].count += 1
    })
  })
  const baselines = SCORE_FACTORS.reduce<Partial<Record<BaselineKey, number>>>((acc, key) => {
    const { sum, count } = sums[key]
    if (count) acc[key] = Number((sum / count).toFixed(2))
    return acc
  }, {})

  // Drought and brown patch get marks of their own because the cards meter them
  // separately. Neither is a score factor: the score averages the pair into
  // summerStress, and that combined mark would sit in the wrong place on either.
  ;(['droughtQuality', 'brownPatch'] as const).forEach((metric) => {
    const values = cultivars
      .map((c) => c.metrics?.[metric]?.mean)
      .filter((v): v is number => typeof v === 'number')
    if (!values.length) return
    const key = metric === 'droughtQuality' ? 'drought' : 'brownPatch'
    baselines[key] = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2))
  })

  return baselines
}

export function scoreBlendForLocation(
  blend: Blend,
  cultivarIndex: Record<string, Cultivar>,
  userLocation: UserLocation | null | undefined,
): BlendFit {
  const components: BlendComponentFit[] = (blend.components || [])
    .map((c) => {
      const cult = cultivarIndex[normalizeKey(c.cultivarId || c.name)]
      if (!cult) return { ...c, cultivar: null, fit: null }
      const fit = scoreCultivarForLocation(cult, userLocation)
      return { ...c, cultivar: cult, fit }
    })

  const scored = components.filter(
    (c): c is ScoredComponent => c.fit?.score != null && c.cultivar != null,
  )
  if (!scored.length) {
    return {
      score: null,
      label: 'Incomplete NTEP coverage',
      components,
      coverage: describeCoverage([]),
      strengths: [],
      watchouts: ['One or more cultivars lack comparable NTEP metrics for your area.'],
    }
  }

  const weights = componentWeights(scored)
  const score = scored.reduce((s, c, i) => s + c.fit.score * weights[i], 0)
  const factors = SCORE_FACTORS.reduce<Partial<Record<ScoreFactor, number>>>((acc, key) => {
    const mean = factorMean(scored, weights, key)
    if (mean != null) acc[key] = mean
    return acc
  }, {})

  const strengths: string[] = []
  const watchouts: string[] = []
  const avgDrought = average(
    scored.map((c) => c.cultivar.metrics?.droughtQuality?.mean).filter((v): v is number => v != null),
  )
  const avgBrown = average(
    scored.map((c) => c.cultivar.metrics?.brownPatch?.mean).filter((v): v is number => v != null),
  )
  const avgColor = average(
    scored.map((c) => c.cultivar.metrics?.geneticColor?.mean).filter((v): v is number => v != null),
  )

  if (avgDrought != null && avgDrought >= 6.4) strengths.push('Strong drought / summer stress signal')
  if (avgBrown != null && avgBrown >= 6.4) strengths.push('Solid brown patch resistance depth')
  if (avgColor != null && avgColor >= 6.5) strengths.push('Darker genetic color')
  if (avgDrought != null && avgDrought < 6.1) watchouts.push('Drought metrics trail top performers')
  if (scored.length < (blend.components || []).length) {
    watchouts.push('Blend includes cultivars outside this NTEP extract')
  }

  const thinnest = scored.reduce(
    (worst, c) => (c.fit.coverage.factors < worst.factors ? c.fit.coverage : worst),
    scored[0].fit.coverage,
  )

  return {
    score: Number(score.toFixed(2)),
    label: `${fitTier(score).word} for your area`,
    components,
    coverage: thinnest,
    strengths,
    watchouts,
    averages: { drought: avgDrought, brownPatch: avgBrown, color: avgColor },
    factors,
    nearestSite: sharedNearestSite(scored),
  }
}

function average(vals: number[]): number | null {
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export function normalizeKey(name: string | null | undefined): string {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
