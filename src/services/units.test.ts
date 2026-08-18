import { describe, expect, it } from 'vitest'
import {
  measureAside,
  measureRange,
  measureText,
  measureUnit,
  perVolume,
  resolveVolumeUnits,
  toGallons,
  toOunces,
  volumeText,
  volumeUnit,
} from './units'
import type { Product } from '../types'

const poured: Pick<Product, 'measure'> = {}
const weighed: Pick<Product, 'measure'> = { measure: 'oz wt' }

describe('measureUnit', () => {
  it('keeps the label unit in US and switches both in metric', () => {
    expect(measureUnit(poured, 'us')).toBe('fl oz')
    expect(measureUnit(weighed, 'us')).toBe('oz wt')
    expect(measureUnit(poured, 'metric')).toBe('ml')
    expect(measureUnit(weighed, 'metric')).toBe('g')
  })

  it('keeps a weighed powder a weight in metric, not a volume', () => {
    expect(measureUnit(weighed, 'metric')).not.toBe('ml')
  })
})

describe('measureText', () => {
  it('prints fluid ounces the way a measuring cup reads', () => {
    expect(measureText(1.4, 'fl oz')).toBe('1.4 fl oz')
    expect(measureText(31.25, 'fl oz')).toBe('31.3 fl oz')
  })

  it('prints millilitres to the syringe, not the decimal place', () => {
    expect(measureText(1.4, 'ml')).toBe('41 ml')
    expect(measureText(0.2, 'ml')).toBe('5.9 ml')
  })

  it('gives a weighed dose the digits a scale can show', () => {
    expect(measureText(0.085, 'oz wt')).toBe('0.085 oz wt')
    expect(measureText(0.085, 'g')).toBe('2.41 g')
    expect(measureText(0.43, 'g')).toBe('12.2 g')
  })
})

describe('volumes', () => {
  it('leaves round tank sizes round in their own unit', () => {
    expect(volumeText(2, 'gal')).toBe('2 gal')
    expect(volumeText(2, 'L')).toBe('7.6 L')
  })

  it('names the unit for mid-sentence use', () => {
    expect(volumeUnit('metric')).toBe('L')
    expect(volumeUnit('us')).toBe('gal')
  })

  it('restates a per-gallon rate per litre', () => {
    // 2 fl oz per gallon is 15.6 ml per litre, and a syringe reads whole ml.
    expect(measureText(perVolume(2, 'L'), 'ml')).toBe('16 ml')
    expect(perVolume(2, 'gal')).toBe(2)
  })
})

describe('dose and tank units apart', () => {
  it('takes a stored tank unit at face value', () => {
    expect(resolveVolumeUnits('us', 'metric')).toBe('us')
    expect(resolveVolumeUnits('metric', 'us')).toBe('metric')
  })

  // The pairing this whole split exists for: a gallon backpack sprayer dosed
  // from a millilitre cup.
  it('lets a millilitre dose sit in a gallon tank', () => {
    expect(volumeUnit(resolveVolumeUnits('us', 'metric'))).toBe('gal')
  })

  it('falls back to the dose unit for a profile saved before the split', () => {
    expect(resolveVolumeUnits(undefined, 'metric')).toBe('metric')
    expect(resolveVolumeUnits(undefined, 'us')).toBe('us')
    // Anything unrecognised in storage is treated the same way.
    expect(resolveVolumeUnits('litres', 'metric')).toBe('metric')
  })
})

describe('round trips', () => {
  it('returns what it was given, so stored values do not drift', () => {
    expect(toOunces(41.4, 'ml')).toBeCloseTo(1.4, 3)
    expect(toOunces(2.41, 'g')).toBeCloseTo(0.085, 3)
    expect(toGallons(7.57, 'L')).toBeCloseTo(2, 2)
    expect(toGallons(2, 'gal')).toBe(2)
  })
})

describe('measureAside', () => {
  it('restates big totals in bottle units', () => {
    expect(measureAside(8, 'fl oz')).toBe('')
    expect(measureAside(20, 'fl oz')).toBe('1.25 pt')
    expect(measureAside(48, 'fl oz')).toBe('1.50 qt')
    expect(measureAside(160, 'fl oz')).toBe('1.25 gal')
  })

  it('moves to litres once millilitres get long', () => {
    expect(measureAside(20, 'ml')).toBe('')
    expect(measureAside(41.5, 'ml')).toBe('1.23 L')
  })

  it('says nothing about a weighed powder, which is not sold by the pint', () => {
    expect(measureAside(20, 'oz wt')).toBe('')
    expect(measureAside(20, 'g')).toBe('')
  })
})

describe('measureRange', () => {
  it('converts both ends and prints the unit once', () => {
    expect(measureRange([1, 2], 'fl oz')).toBe('1.0–2.0')
    expect(measureRange([1, 2], 'ml')).toBe('30–59')
  })
})
