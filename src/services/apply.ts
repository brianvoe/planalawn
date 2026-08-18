import { spreaderById } from '../data/spreaders'
import type { Product, ProductBag, SpreaderSetting } from '../types'

/**
 * Turning a label rate into what you actually do in the yard.
 *
 * Everything here works from the broadcast rate per 1,000 sq ft, because that
 * is the only figure that scales to a lawn. A sprayer's fl oz per gallon is
 * then a consequence of how much water that sprayer lays down per 1,000 sq ft
 * — never the starting point, or the same tank would over- or under-dose
 * depending on how fast you walk.
 */

export interface LiquidPlan {
  /** Concentrate for the whole area, fl oz. */
  totalProductOz: number
  /** Water for the whole area, gallons, at your spray rate. */
  totalWaterGal: number
  /** Tanks to mix, as a fraction — 2.4 means two full tanks and a part one. */
  tanks: number
  /** Concentrate in one full tank, fl oz. */
  perTankProductOz: number
  /** Ground one full tank covers at your spray rate, sq ft. */
  perTankCoverageSqFt: number
  /** What that works out to per gallon of water in the tank. */
  ozPerGallonInTank: number
  /** Where the label's own water volume would put your coverage per tank. */
  labelCoverageSqFt: [number, number] | null
}

export interface GranularPlan {
  /** Product for the whole area, lb. */
  totalLb: number
  /** The bag to buy and how many, when bag sizes are known. */
  bag: (ProductBag & { count: number }) | null
  /** Published setting for the chosen spreader, or null when there isn't one. */
  setting: SpreaderSetting | null
  /** The label rules this spreader out — a different answer than "unpublished". */
  prohibited: boolean
}

export interface Calibration {
  /** What the test pass actually put down, lb per 1,000 sq ft. */
  measuredPer1000: number
  /** Ratio to target: 1 is on the money, 1.2 is 20% heavy. */
  ratio: number
  verdict: 'low' | 'good' | 'high'
  advice: string
}

/** Within this much of target, walking speed matters more than the dial. */
const CALIBRATION_TOLERANCE = 0.1

export function amountPer1000(sqFt: number, per1000: number): number {
  return (sqFt / 1000) * per1000
}

export function liquidPlan({
  product,
  sqFt,
  tankGallons,
  coverageSqFtPerTank,
}: {
  product: Product
  sqFt: number
  tankGallons: number
  coverageSqFtPerTank: number
}): LiquidPlan {
  const ozPer1000 = product.ozPer1000 || 0
  const coverage = coverageSqFtPerTank > 0 ? coverageSqFtPerTank : 1000
  const tanks = sqFt / coverage
  const perTankProductOz = amountPer1000(coverage, ozPer1000)
  const water = product.waterGalPer1000

  return {
    totalProductOz: amountPer1000(sqFt, ozPer1000),
    totalWaterGal: tankGallons * tanks,
    tanks,
    perTankProductOz,
    perTankCoverageSqFt: coverage,
    ozPerGallonInTank: tankGallons > 0 ? perTankProductOz / tankGallons : 0,
    labelCoverageSqFt: water
      ? [(tankGallons / water[1]) * 1000, (tankGallons / water[0]) * 1000]
      : null,
  }
}

/** The label's spot-spray mix for a partly filled tank, fl oz. */
export function spotMixOz(product: Product, gallons: number): number | null {
  if (product.ozPerGallon == null) return null
  return product.ozPerGallon * gallons
}

/**
 * The bag that covers the job in the fewest units.
 *
 * Bigger bags are cheaper per pound, so the biggest one that doesn't leave
 * most of a bag behind wins; ties go to fewer bags to carry.
 */
function pickBag(bags: ProductBag[], totalLb: number): (ProductBag & { count: number }) | null {
  if (!bags.length) return null
  const scored = bags
    .map((bag) => ({
      ...bag,
      // The epsilon keeps float noise from selling someone a second bag: a bag
      // rated for exactly this area should count as one.
      count: Math.max(1, Math.ceil(totalLb / bag.lb - 1e-6)),
    }))
    .sort((a, b) => a.count * a.lb - b.count * b.lb || a.count - b.count)
  return scored[0]
}

export function granularPlan({
  product,
  sqFt,
  spreaderId,
}: {
  product: Product
  sqFt: number
  spreaderId: string
}): GranularPlan {
  const totalLb = amountPer1000(sqFt, product.lbPer1000 || 0)
  const prohibited = Boolean(spreaderId) && (product.notLabeledFor || []).includes(spreaderId)
  return {
    totalLb,
    bag: pickBag(product.bags || [], totalLb),
    setting: prohibited
      ? null
      : (product.settings || []).find((s) => s.spreaderId === spreaderId) || null,
    prohibited,
  }
}

/**
 * Reads a catch-and-weigh test pass back as a rate.
 *
 * The only honest way to a dial number the label doesn't print: spread over a
 * measured strip, weigh what left the hopper, and compare. Percentages beat
 * dial numbers as advice because two spreaders never share a scale.
 */
export function calibration({
  lbUsed,
  swathFt,
  distanceFt,
  targetPer1000,
}: {
  lbUsed: number
  swathFt: number
  distanceFt: number
  targetPer1000: number
}): Calibration | null {
  const area = swathFt * distanceFt
  if (!(area > 0) || !(targetPer1000 > 0) || !(lbUsed > 0)) return null

  const measuredPer1000 = (lbUsed / area) * 1000
  const ratio = measuredPer1000 / targetPer1000
  const off = Math.round(Math.abs(ratio - 1) * 100)

  if (Math.abs(ratio - 1) <= CALIBRATION_TOLERANCE) {
    return {
      measuredPer1000,
      ratio,
      verdict: 'good',
      advice: `Within ${off}% of the bag rate — leave the dial there and keep your walking pace steady.`,
    }
  }
  if (ratio < 1) {
    return {
      measuredPer1000,
      ratio,
      verdict: 'low',
      advice: `About ${off}% light. Open the dial a little or slow down, then run the strip again.`,
    }
  }
  return {
    measuredPer1000,
    ratio,
    verdict: 'high',
    advice: `About ${off}% heavy. Close the dial a little or walk faster, then run the strip again — heavy is the one that burns turf.`,
  }
}

/** A test strip long enough to weigh honestly, given the spreader's throw. */
export function testStripFt(spreaderId: string): number {
  const swath = spreaderById[spreaderId]?.swathFt || 6
  return Math.round(1000 / swath / 5) * 5
}

export function rateRangeLabel(
  value: number | undefined,
  range: [number, number] | undefined,
  unit: string,
): string {
  if (value == null) return ''
  if (!range) return `${value} ${unit}`
  return `${value} ${unit} (label allows ${range[0]}–${range[1]})`
}
