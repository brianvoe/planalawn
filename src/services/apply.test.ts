import { describe, expect, it } from 'vitest'
import { calibration, granularPlan, liquidPlan, spotMixOz, testStripFt } from './apply'
import type { Product } from '../types'

const liquid: Product = {
  id: 'test-liquid',
  name: 'Test liquid',
  brand: 'Test',
  form: 'liquid',
  active: 'nothing',
  purpose: 'testing',
  taskIds: [],
  ozPer1000: 4,
  waterGalPer1000: [1, 2],
  ozPerGallon: 1.5,
  notes: '',
}

const granular: Product = {
  id: 'test-granular',
  name: 'Test granular',
  brand: 'Test',
  form: 'granular',
  active: 'nothing',
  purpose: 'testing',
  taskIds: [],
  lbPer1000: 3,
  bags: [
    { lb: 12, coverageSqFt: 4000 },
    { lb: 37, coverageSqFt: 12000 },
  ],
  settings: [{ spreaderId: 'scotts-edgeguard-dlx', setting: '5' }],
  notes: '',
}

describe('liquidPlan', () => {
  it('scales the concentrate by area, not by tank size', () => {
    const small = liquidPlan({
      product: liquid,
      sqFt: 5000,
      tankGallons: 2,
      coverageSqFtPerTank: 1000,
    })
    const big = liquidPlan({
      product: liquid,
      sqFt: 5000,
      tankGallons: 4,
      coverageSqFtPerTank: 1000,
    })
    expect(small.totalProductOz).toBe(20)
    expect(big.totalProductOz).toBe(20)
  })

  it('puts one tank of coverage worth of product in each tank', () => {
    const plan = liquidPlan({
      product: liquid,
      sqFt: 5000,
      tankGallons: 2,
      coverageSqFtPerTank: 1500,
    })
    expect(plan.perTankProductOz).toBe(6)
    expect(plan.tanks).toBeCloseTo(3.333, 3)
    expect(plan.ozPerGallonInTank).toBe(3)
  })

  it('reports where the label water volume would put coverage per tank', () => {
    const plan = liquidPlan({
      product: liquid,
      sqFt: 5000,
      tankGallons: 2,
      coverageSqFtPerTank: 1000,
    })
    // 2 gal at 2 gal/1000 covers 1,000 sq ft; at 1 gal/1000 it covers 2,000.
    expect(plan.labelCoverageSqFt).toEqual([1000, 2000])
  })

  it('survives an uncalibrated sprayer without dividing by zero', () => {
    const plan = liquidPlan({
      product: liquid,
      sqFt: 5000,
      tankGallons: 0,
      coverageSqFtPerTank: 0,
    })
    expect(plan.perTankCoverageSqFt).toBe(1000)
    expect(plan.ozPerGallonInTank).toBe(0)
  })
})

describe('spotMixOz', () => {
  it('uses the label spot rate when there is one', () => {
    expect(spotMixOz(liquid, 2)).toBe(3)
  })

  it('returns null rather than inventing a per-gallon rate', () => {
    expect(spotMixOz({ ...liquid, ozPerGallon: undefined }, 2)).toBeNull()
  })
})

describe('granularPlan', () => {
  it('totals pounds from the bag rate', () => {
    const plan = granularPlan({
      product: granular,
      sqFt: 5000,
      spreaderId: '',
    })
    expect(plan.totalLb).toBe(15)
  })

  it('picks the bag combination with the least product left over', () => {
    const plan = granularPlan({
      product: granular,
      sqFt: 5000,
      spreaderId: '',
    })
    expect(plan.bag).toMatchObject({ lb: 12, count: 2 })
  })

  it('sells one bag when the bag is rated for exactly this area', () => {
    // 2.87 lb/1,000 over 5,000 sq ft is 14.35 lb in decimal, 14.350000000000001
    // in binary — the bag rated for 5,000 sq ft still has to be enough.
    const grubex = {
      ...granular,
      lbPer1000: 2.87,
      bags: [
        { lb: 14.35, coverageSqFt: 5000 },
        { lb: 28.7, coverageSqFt: 10000 },
      ],
    }
    const plan = granularPlan({ product: grubex, sqFt: 5000, spreaderId: '' })
    expect(plan.bag).toMatchObject({ lb: 14.35, count: 1 })
  })

  it('separates a spreader the label forbids from one it just omits', () => {
    const banned = { ...granular, notLabeledFor: ['earthway'] }
    const plan = granularPlan({
      product: banned,
      sqFt: 5000,
      spreaderId: 'earthway',
    })
    expect(plan.prohibited).toBe(true)
    expect(plan.setting).toBeNull()

    const quiet = granularPlan({
      product: granular,
      sqFt: 5000,
      spreaderId: 'earthway',
    })
    expect(quiet.prohibited).toBe(false)
  })

  it('only reports a setting published for the spreader you own', () => {
    const known = granularPlan({
      product: granular,
      sqFt: 5000,
      spreaderId: 'scotts-edgeguard-dlx',
    })
    const unknown = granularPlan({
      product: granular,
      sqFt: 5000,
      spreaderId: 'earthway',
    })
    expect(known.setting?.setting).toBe('5')
    expect(unknown.setting).toBeNull()
  })
})

describe('calibration', () => {
  it('reads a test pass back as pounds per 1,000 sq ft', () => {
    const result = calibration({
      lbUsed: 3,
      swathFt: 6,
      distanceFt: 167,
      targetPer1000: 3,
    })
    expect(result?.measuredPer1000).toBeCloseTo(2.994, 2)
    expect(result?.verdict).toBe('good')
  })

  it('calls out a heavy pass, which is the dangerous direction', () => {
    const result = calibration({
      lbUsed: 6,
      swathFt: 6,
      distanceFt: 167,
      targetPer1000: 3,
    })
    expect(result?.verdict).toBe('high')
    expect(result?.advice).toContain('heavy')
  })

  it('calls out a light pass', () => {
    const result = calibration({
      lbUsed: 1.5,
      swathFt: 6,
      distanceFt: 167,
      targetPer1000: 3,
    })
    expect(result?.verdict).toBe('low')
  })

  it('refuses nonsense input instead of returning a number', () => {
    expect(calibration({ lbUsed: 0, swathFt: 6, distanceFt: 100, targetPer1000: 3 })).toBeNull()
    expect(calibration({ lbUsed: 2, swathFt: 0, distanceFt: 100, targetPer1000: 3 })).toBeNull()
    expect(calibration({ lbUsed: 2, swathFt: 6, distanceFt: 100, targetPer1000: 0 })).toBeNull()
  })
})

describe('helpers', () => {
  it('suggests a strip that covers about 1,000 sq ft', () => {
    expect(testStripFt('scotts-edgeguard-dlx')).toBe(165)
  })
})
