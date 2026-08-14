import type { RateTemplate, SprayerMixInput, SprayerMixResult } from '../types'

/**
 * Product rate templates — starting guidance for cool-season (tall fescue)
 * lawns. Rates are not region-specific.
 * Always confirm the bag/label you buy.
 */

export const rateTemplates: Record<string, RateTemplate> = {
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
  preEmGeneric: {
    id: 'preEmGeneric',
    label: 'Pre-emergent granule (generic)',
    unit: 'lb',
    per1000: 3,
    range: [1.5, 4],
    notes: 'Typical 0.37%-class crabgrass preventer. Bag rate for YOUR concentration wins.',
  },
  prodiamineG: {
    id: 'prodiamineG',
    label: 'Prodiamine granule (Barricade-type)',
    unit: 'lb',
    per1000: 2.5,
    range: [1.5, 4],
    notes: 'Starting template for a common 0.37% prodiamine granule. Blocks seed — check wait-to-seed.',
  },
  dithiopyrG: {
    id: 'dithiopyrG',
    label: 'Dithiopyr granule (Dimension-type)',
    unit: 'lb',
    per1000: 2.2,
    range: [1.5, 3.5],
    notes: 'Some dithiopyr labels allow a little early post-em on tiny crabgrass. Still a preventer first.',
  },
  pendimethalinG: {
    id: 'pendimethalinG',
    label: 'Pendimethalin granule (Halts-type)',
    unit: 'lb',
    per1000: 3,
    range: [2, 4],
    notes: 'Common big-box crabgrass preventer. Water in; stains and wait-to-seed still apply.',
  },
  broadleaf3way: {
    id: 'broadleaf3way',
    label: 'Broadleaf 3-way (2,4-D mix)',
    mixMode: 'perGallon',
    ozPerGallon: 1.5,
    rangeOzPerGallon: [1, 2],
    notes: 'Example concentrate mix only. Spot vs broadcast and cool- vs warm-season rates differ.',
  },
  twentyFourD: {
    id: 'twentyFourD',
    label: '2,4-D amine (single active)',
    mixMode: 'perGallon',
    ozPerGallon: 1.1,
    rangeOzPerGallon: [0.75, 1.5],
    notes: 'Starting oz/gal for a typical 3.8 lb/gal amine. Turf species and temperature matter.',
  },
  quinclorac: {
    id: 'quinclorac',
    label: 'Quinclorac (Drive-type)',
    mixMode: 'per1000',
    ozPer1000: 1.45,
    notes: 'Example fl oz per 1000 sq ft for a liquid crabgrass rescue. Must be labeled for YOUR grass.',
  },
  imidaclopridG: {
    id: 'imidaclopridG',
    label: 'Imidacloprid granule (preventative)',
    unit: 'lb',
    per1000: 3,
    range: [2, 4],
    notes: 'Typical 0.2%-class preventative grub granule. Needs to be down before larvae are large.',
  },
  chlorantraniliproleG: {
    id: 'chlorantraniliproleG',
    label: 'Chlorantraniliprole granule (Acelepryn-type)',
    unit: 'lb',
    per1000: 2.5,
    range: [1.5, 3.5],
    notes: 'Longer-window preventative. Still follow the bag — not a late-summer curative.',
  },
  trichlorfonG: {
    id: 'trichlorfonG',
    label: 'Trichlorfon (Dylox-type, curative)',
    unit: 'lb',
    per1000: 3,
    range: [2, 4],
    notes: 'Curative when grubs are already feeding. Water in immediately. Short residual.',
  },
}

/** Cubic yards from sq ft and depth inches */
export function volumeCubicYards(sqFt: number, depthInches: number): number {
  const cuFt = sqFt * (depthInches / 12)
  return cuFt / 27
}

export function amountFromPer1000(sqFt: number, per1000: number): number {
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
}: SprayerMixInput = {}): SprayerMixResult {
  if (mode === 'perGallon') {
    const productOz = tankGallons * ozPerGallon
    const tanksNeeded = coverageSqFtPerTank ? targetSqFt / coverageSqFtPerTank : 1
    return {
      productOzPerTank: productOz,
      waterGallonsPerTank: tankGallons,
      tanksNeeded,
      totalProductOz: productOz * tanksNeeded,
      totalWaterGallons: tankGallons * tanksNeeded,
    }
  }

  const ozForCoverage =
    coverageSqFtPerTank > 0 ? (ozPer1000 * coverageSqFtPerTank) / 1000 : ozPer1000
  const tanksNeeded = coverageSqFtPerTank ? targetSqFt / coverageSqFtPerTank : 1
  return {
    productOzPerTank: ozForCoverage,
    waterGallonsPerTank: tankGallons,
    tanksNeeded,
    totalProductOz: ozForCoverage * tanksNeeded,
    totalWaterGallons: tankGallons * tanksNeeded,
  }
}
