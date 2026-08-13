import sites from '../data/ntep/sites.json'
import { climateBands, climateBandFromLat } from '../data/climate'

function haversineKm(aLat, aLon, bLat, bLon) {
  const toRad = (d) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(bLat - aLat)
  const dLon = toRad(bLon - aLon)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
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
export function nearestNtepSites(latitude, longitude, limit = 3, codes = null) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return []
  const allowed = codes ? new Set(codes) : null
  return Object.entries(sites)
    .filter(([code]) => !allowed || allowed.has(code))
    .map(([code, site]) => ({
      code,
      ...site,
      distanceKm: haversineKm(latitude, longitude, site.lat, site.lon),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
}

export function resolveUserClimate(userLocation) {
  if (!userLocation) return null
  const bandId =
    userLocation.climateBand || climateBandFromLat(userLocation.latitude)?.id
  return bandId ? climateBands[bandId] : null
}

/**
 * The five factors a complete score is built from. Used to report coverage.
 */
export const SCORE_FACTORS = ['nearest', 'region', 'summerStress', 'color', 'national']

/**
 * Describes how much evidence a score actually rests on.
 *
 * This matters because the score is renormalized over whichever factors are
 * present: a cultivar with only 2 of 5 factors is scored on those 2 alone and
 * would otherwise be presented with the same apparent confidence as a fully
 * documented one. Missing trial data must not make a cultivar look better
 * (nor worse) than one that was actually measured.
 */
function describeCoverage(parts) {
  const weight = parts.reduce((s, p) => s + p.weight, 0)
  return {
    factors: parts.length,
    totalFactors: SCORE_FACTORS.length,
    missing: SCORE_FACTORS.filter((f) => !parts.some((p) => p.key === f)),
    // Share of the intended weighting that was actually available.
    weight: Number(weight.toFixed(2)),
    complete: parts.length === SCORE_FACTORS.length,
  }
}

/** Short human label for a coverage object, e.g. "2 of 5 factors". */
export function coverageLabel(coverage) {
  if (!coverage) return ''
  return `${coverage.factors} of ${coverage.totalFactors} factors`
}

/**
 * How close two scores must be before evidence decides the order.
 *
 * Renormalizing over the available factors lets a thinly documented cultivar
 * edge out a fully measured one on the raw number, which is not a real
 * difference in performance. Ranking therefore treats gaps under this value as
 * a tie and puts the better-evidenced cultivar first.
 */
const FIT_TIE_BAND = 0.15

/**
 * Sort key for "best for my area". Subtracting a fixed amount for incomplete
 * coverage keeps the comparison a total order — a tolerance-based comparator
 * would be non-transitive and give Array.prototype.sort inconsistent results.
 *
 * This orders results only; the score shown to the user is never adjusted.
 */
export function fitRank(fit) {
  // Finite sentinel below the 1-9 rating scale: -Infinity would make the
  // difference of two unscored cultivars NaN and corrupt the sort.
  if (!fit || fit.score == null) return -1
  return fit.score - (fit.coverage?.complete ? 0 : FIT_TIE_BAND)
}

/**
 * Weighted suitability for a cultivar given user location.
 * Weights (sum 100):
 *  35% nearest-site quality (or knoxville/transition fallback)
 *  25% climate-band regional quality (transition mean when transition)
 *  20% summer stress (drought + brown patch)
 *  10% genetic color
 *  10% national/LPI mean
 *
 * Absent factors are dropped and the remainder renormalized, so always read
 * `coverage` alongside `score` before ranking one cultivar above another.
 */
export function scoreCultivarForLocation(cultivar, userLocation) {
  const metrics = cultivar.metrics || {}
  // Nearest site this cultivar was actually rated at, not the nearest site in
  // the trial — otherwise this factor quietly falls back to the national mean
  // for anyone closer to a site that only measured, say, genetic color.
  const nearest = nearestNtepSites(
    userLocation?.latitude,
    userLocation?.longitude,
    1,
    Object.keys(metrics.transitionQuality?.bySite || {}),
  )[0]
  const climate = resolveUserClimate(userLocation)

  const parts = []
  let nearestScore = null
  if (nearest && metrics.transitionQuality?.bySite?.[nearest.code] != null) {
    nearestScore = metrics.transitionQuality.bySite[nearest.code]
  } else if (metrics.knoxvilleQuality?.mean != null && climate?.id === 'transition') {
    nearestScore = metrics.knoxvilleQuality.mean
  } else if (metrics.transitionQuality?.mean != null && climate?.id === 'transition') {
    nearestScore = metrics.transitionQuality.mean
  } else if (metrics.nationalMeanQuality?.mean != null) {
    nearestScore = metrics.nationalMeanQuality.mean
  }
  if (nearestScore != null) parts.push({ key: 'nearest', weight: 0.35, value: nearestScore })

  let regionScore = null
  if (climate?.id === 'transition' && metrics.transitionQuality?.mean != null) {
    regionScore = metrics.transitionQuality.mean
  } else if (metrics.nationalMeanQuality?.mean != null) {
    regionScore = metrics.nationalMeanQuality.mean
  }
  if (regionScore != null) parts.push({ key: 'region', weight: 0.25, value: regionScore })

  const drought = metrics.droughtQuality?.mean
  const brown = metrics.brownPatch?.mean
  const stressVals = [drought, brown].filter((v) => typeof v === 'number')
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
      nearestSite: nearest || null,
      climate,
    }
  }

  const weightSum = parts.reduce((s, p) => s + p.weight, 0)
  const score = parts.reduce((s, p) => s + p.value * (p.weight / weightSum), 0)

  let label = 'Fair fit'
  if (score >= 6.6) label = 'Excellent fit'
  else if (score >= 6.2) label = 'Good fit'
  else if (score >= 5.8) label = 'Moderate fit'
  else label = 'Challenging fit'

  return {
    score: Number(score.toFixed(2)),
    label,
    parts,
    coverage: describeCoverage(parts),
    nearestSite: nearest || null,
    climate,
  }
}

export function scoreBlendForLocation(blend, cultivarIndex, userLocation) {
  const components = (blend.components || [])
    .map((c) => {
      const cult = cultivarIndex[normalizeKey(c.cultivarId || c.name)]
      if (!cult) return null
      const fit = scoreCultivarForLocation(cult, userLocation)
      return { ...c, cultivar: cult, fit }
    })
    .filter(Boolean)

  const scored = components.filter((c) => c.fit.score != null)
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

  // Prefer percent-weighted mean when percents exist
  const hasPct = scored.every((c) => typeof c.percent === 'number')
  let score
  if (hasPct) {
    const total = scored.reduce((s, c) => s + c.percent, 0) || 1
    score = scored.reduce((s, c) => s + c.fit.score * (c.percent / total), 0)
  } else {
    score = scored.reduce((s, c) => s + c.fit.score, 0) / scored.length
  }

  const strengths = []
  const watchouts = []
  const avgDrought =
    average(
      scored.map((c) => c.cultivar.metrics?.droughtQuality?.mean).filter((v) => v != null),
    )
  const avgBrown =
    average(
      scored.map((c) => c.cultivar.metrics?.brownPatch?.mean).filter((v) => v != null),
    )
  const avgColor =
    average(
      scored.map((c) => c.cultivar.metrics?.geneticColor?.mean).filter((v) => v != null),
    )

  if (avgDrought != null && avgDrought >= 6.4) strengths.push('Strong drought / summer stress signal')
  if (avgBrown != null && avgBrown >= 6.4) strengths.push('Solid brown patch resistance depth')
  if (avgColor != null && avgColor >= 6.5) strengths.push('Darker genetic color')
  if (avgDrought != null && avgDrought < 6.1) watchouts.push('Drought metrics trail top performers')
  if (scored.length < (blend.components || []).length) {
    watchouts.push('Blend includes cultivars outside this NTEP extract')
  }

  let label = 'Fair fit'
  if (score >= 6.6) label = 'Excellent for your area'
  else if (score >= 6.2) label = 'Good for your area'
  else if (score >= 5.8) label = 'Moderate for your area'
  else label = 'Challenging for your area'

  // A blend is only as well-evidenced as its thinnest scored component.
  const thinnest = scored.reduce(
    (worst, c) => (c.fit.coverage.factors < worst.factors ? c.fit.coverage : worst),
    scored[0].fit.coverage,
  )

  return {
    score: Number(score.toFixed(2)),
    label,
    components,
    coverage: thinnest,
    strengths,
    watchouts,
    averages: { drought: avgDrought, brownPatch: avgBrown, color: avgColor },
  }
}

function average(vals) {
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export function normalizeKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
