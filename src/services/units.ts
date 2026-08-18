import type { LiquidMeasure, Product, SprayUnits } from '../types'

/**
 * Showing the sprayer numbers in the units you actually measure with.
 *
 * Every rate in the catalog is stored as the label prints it — fluid ounces,
 * ounces by weight, gallons — because that is what you can check against a
 * bottle. Conversion happens here, at the last moment before display, so there
 * is only ever one set of numbers doing arithmetic.
 *
 * Areas stay in square feet in both systems. Label rates are per 1,000 sq ft,
 * and restating that as square metres would only move rounding error around.
 */

const ML_PER_FL_OZ = 29.5735
const G_PER_OZ = 28.3495
const L_PER_GAL = 3.785411784

/** What a dose is measured in: poured or weighed, US or metric. */
export type MeasureUnit = LiquidMeasure | 'ml' | 'g'
export type VolumeUnit = 'gal' | 'L'

/** How to say the volume unit mid-sentence, as in "per gallon". */
export const volumeNoun: Record<VolumeUnit, string> = { gal: 'gallon', L: 'liter' }

/** The unit a product's dose is shown in — a dry powder stays a weight. */
export function measureUnit(product: Pick<Product, 'measure'>, units: SprayUnits): MeasureUnit {
  const printed: LiquidMeasure = product.measure || 'fl oz'
  if (units !== 'metric') return printed
  return printed === 'oz wt' ? 'g' : 'ml'
}

export function volumeUnit(units: SprayUnits): VolumeUnit {
  return units === 'metric' ? 'L' : 'gal'
}

/**
 * The tank's unit for a profile that may predate dose and tank being separate.
 *
 * Before the split, one choice drove both, so a saved 'metric' meant litres as
 * well as millilitres. Falling back to the dose unit keeps those profiles
 * reading exactly as they did instead of silently resetting them to gallons.
 */
export function resolveVolumeUnits(saved: unknown, doseUnits: SprayUnits): SprayUnits {
  return saved === 'metric' || saved === 'us' ? saved : doseUnits
}

/** A label figure in ounces, in whatever unit is on screen. */
export function convertMeasure(oz: number, unit: MeasureUnit): number {
  if (unit === 'ml') return oz * ML_PER_FL_OZ
  if (unit === 'g') return oz * G_PER_OZ
  return oz
}

/** Back to ounces, for anything that gets stored or fed to the math. */
export function toOunces(value: number, unit: MeasureUnit): number {
  if (unit === 'ml') return value / ML_PER_FL_OZ
  if (unit === 'g') return value / G_PER_OZ
  return value
}

export function convertVolume(gal: number, unit: VolumeUnit): number {
  return unit === 'L' ? gal * L_PER_GAL : gal
}

export function toGallons(value: number, unit: VolumeUnit): number {
  return unit === 'L' ? value / L_PER_GAL : value
}

/** A per-gallon rate restated per litre, so it pairs with a metric tank. */
export function perVolume(ozPerGal: number, unit: VolumeUnit): number {
  return unit === 'L' ? ozPerGal / L_PER_GAL : ozPerGal
}

export function fromPerVolume(ozPerUnit: number, unit: VolumeUnit): number {
  return unit === 'L' ? ozPerUnit * L_PER_GAL : ozPerUnit
}

/**
 * Decimals worth printing, chosen by what you'd measure the dose with.
 *
 * A cup reads to a tenth of an ounce and a syringe to the millilitre, so more
 * digits than that are decoration. Weighed powders get finer, because a small
 * dose of a WDG rounds to nothing otherwise and the scale can read it.
 */
export function formatMeasure(value: number, unit: MeasureUnit): string {
  if (unit === 'ml') return value < 10 ? value.toFixed(1) : value.toFixed(0)
  if (unit === 'g') return value < 10 ? value.toFixed(2) : value.toFixed(1)
  if (unit === 'oz wt') return value < 0.1 ? value.toFixed(3) : value.toFixed(2)
  return value.toFixed(1)
}

export function formatVolume(value: number, unit: VolumeUnit): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/** An ounce figure as text with its unit, e.g. "41 ml". */
export function measureText(oz: number, unit: MeasureUnit): string {
  return `${formatMeasure(convertMeasure(oz, unit), unit)} ${unit}`
}

/** The same for a label's allowed range, without repeating the unit. */
export function measureRange(range: [number, number], unit: MeasureUnit): string {
  const [low, high] = range
  return `${formatMeasure(convertMeasure(low, unit), unit)}–${formatMeasure(convertMeasure(high, unit), unit)}`
}

export function volumeText(gal: number, unit: VolumeUnit): string {
  return `${formatVolume(convertVolume(gal, unit), unit)} ${unit}`
}

/**
 * A big total restated in the unit the bottle is sold in.
 *
 * Forty ounces means more as "1.25 qt" when you're standing in the aisle, and
 * 1,200 ml means more as "1.2 L". Weighed powders get nothing: nobody sells a
 * WDG by the pint.
 */
export function measureAside(oz: number, unit: MeasureUnit): string {
  if (unit === 'ml') {
    const ml = convertMeasure(oz, unit)
    return ml >= 1000 ? `${(ml / 1000).toFixed(2)} L` : ''
  }
  if (unit !== 'fl oz') return ''
  if (oz >= 128) return `${(oz / 128).toFixed(2)} gal`
  if (oz >= 32) return `${(oz / 32).toFixed(2)} qt`
  if (oz >= 16) return `${(oz / 16).toFixed(2)} pt`
  return ''
}
