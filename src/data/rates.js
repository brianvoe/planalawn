/**
 * Product rate templates — starting guidance for cool-season (tall fescue)
 * lawns. Rates are not region-specific.
 * Always confirm the bag/label you buy.
 */

export const rateTemplates = {
  seedOverseed: {
    id: 'seedOverseed',
    label: 'Tall fescue overseed',
    unit: 'lb',
    per1000: 5,
    range: [4, 6],
    notes: 'Typical overseed rate. New lawn from bare soil is higher.',
  },
  seedNew: {
    id: 'seedNew',
    label: 'Tall fescue new lawn',
    unit: 'lb',
    per1000: 8,
    range: [7, 10],
    notes: 'Bare-ground / full renovation rate.',
  },
  starterFert: {
    id: 'starterFert',
    label: 'Starter fertilizer',
    unit: 'lb',
    per1000: 10,
    range: [8, 12],
    notes: 'Follow bag N-P-K analysis. Example assumes a typical starter bag rate.',
  },
  maintFert: {
    id: 'maintFert',
    label: 'Maintenance fertilizer',
    unit: 'lb',
    per1000: 8,
    range: [6, 10],
    notes: 'Cool-season window; avoid heavy summer nitrogen.',
  },
  glyphosate: {
    id: 'glyphosate',
    label: 'Non-selective herbicide (glyphosate-type)',
    mixMode: 'perGallon',
    ozPerGallon: 2,
    rangeOzPerGallon: [1.5, 2.5],
    notes: 'Example mix only — read YOUR product label. Spot vs broadcast rates differ.',
  },
  peatMoss: {
    id: 'peatMoss',
    label: 'Peat moss topdress',
    depthInches: 0.25,
    notes: 'Thin layer after seeding. Volume ≈ area × depth.',
  },
  topsoil: {
    id: 'topsoil',
    label: 'Topsoil / compost blend',
    depthInches: 0.5,
    notes: 'Light leveling layer. Deeper fill for low spots as needed.',
  },
  mulch: {
    id: 'mulch',
    label: 'Bed mulch',
    depthInches: 2.5,
    notes: 'Typical bed depth 2–3 in. Keep off tree trunks.',
  },
}

/** Cubic yards from sq ft and depth inches */
export function volumeCubicYards(sqFt, depthInches) {
  const cuFt = sqFt * (depthInches / 12)
  return cuFt / 27
}

export function amountFromPer1000(sqFt, per1000) {
  return (sqFt / 1000) * per1000
}

/**
 * Sprayer mix helpers
 * mode: 'perGallon' | 'per1000'
 */
export function sprayerMix({
  mode = 'perGallon',
  tankGallons = 2,
  ozPerGallon = 2,
  ozPer1000 = 0,
  coverageSqFtPerTank = 1000,
  targetSqFt = 1000,
}) {
  if (mode === 'perGallon') {
    const productOz = tankGallons * ozPerGallon
    const tanksNeeded = coverageSqFtPerTank
      ? targetSqFt / coverageSqFtPerTank
      : 1
    return {
      productOzPerTank: productOz,
      waterGallonsPerTank: tankGallons,
      tanksNeeded,
      totalProductOz: productOz * tanksNeeded,
      totalWaterGallons: tankGallons * tanksNeeded,
    }
  }

  // per 1000 → scale to tank coverage
  const ozForCoverage =
    coverageSqFtPerTank > 0 ? (ozPer1000 * coverageSqFtPerTank) / 1000 : ozPer1000
  const tanksNeeded = coverageSqFtPerTank
    ? targetSqFt / coverageSqFtPerTank
    : 1
  return {
    productOzPerTank: ozForCoverage,
    waterGallonsPerTank: tankGallons,
    tanksNeeded,
    totalProductOz: ozForCoverage * tanksNeeded,
    totalWaterGallons: tankGallons * tanksNeeded,
  }
}
