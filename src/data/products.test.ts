import { describe, expect, it } from 'vitest'
import { products } from './products'
import { spreaderById } from './spreaders'
import { tasks } from './tasks'

/**
 * Guard rails for the product catalog.
 *
 * The numbers here come off labels, so the test's job is to catch the ways a
 * hand-entered entry goes wrong: a rate on the wrong form, a spreader setting
 * for a spreader nobody owns, a rate outside its own stated range.
 */

const taskIds = new Set(tasks.map((t) => t.id))

describe('product catalog', () => {
  it('has entries', () => {
    expect(products.length).toBeGreaterThan(0)
  })

  it('uses unique ids', () => {
    const ids = products.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  products.forEach((p) => {
    describe(p.name, () => {
      it('carries the rate its form needs', () => {
        if (p.form === 'liquid') {
          expect(p.ozPer1000, 'fl oz per 1,000 sq ft').toBeGreaterThan(0)
          expect(p.lbPer1000).toBeUndefined()
        } else {
          expect(p.lbPer1000, 'lb per 1,000 sq ft').toBeGreaterThan(0)
          expect(p.ozPer1000).toBeUndefined()
        }
      })

      it('sits inside its own label range', () => {
        if (p.ozPer1000Range) {
          expect(p.ozPer1000).toBeGreaterThanOrEqual(p.ozPer1000Range[0])
          expect(p.ozPer1000).toBeLessThanOrEqual(p.ozPer1000Range[1])
        }
        if (p.lbPer1000Range) {
          expect(p.lbPer1000).toBeGreaterThanOrEqual(p.lbPer1000Range[0])
          expect(p.lbPer1000).toBeLessThanOrEqual(p.lbPer1000Range[1])
        }
      })

      // An empty list is allowed: a fungicide has no task in the calendar to
      // hang off, and inventing one would promote it in the wrong week.
      it('points at tasks that exist', () => {
        p.taskIds.forEach((id) => expect(taskIds.has(id), `unknown task ${id}`).toBe(true))
      })

      it('only lists settings for spreaders we know', () => {
        ;(p.settings || []).forEach((s) => {
          expect(spreaderById[s.spreaderId], `unknown spreader ${s.spreaderId}`).toBeTruthy()
          expect(s.setting.trim().length).toBeGreaterThan(0)
        })
      })

      it('has one setting per spreader at most', () => {
        const ids = (p.settings || []).map((s) => s.spreaderId)
        expect(new Set(ids).size).toBe(ids.length)
      })

      it('states bag coverage that matches its own rate', () => {
        ;(p.bags || []).forEach((bag) => {
          const implied = (bag.lb / (p.lbPer1000 || 1)) * 1000
          // Bag copy rounds hard, and some bags print the light end of a rate
          // range, so this only catches an order-of-magnitude slip.
          expect(bag.coverageSqFt).toBeGreaterThan(implied * 0.5)
          expect(bag.coverageSqFt).toBeLessThan(implied * 2)
        })
      })

      it('links a label', () => {
        expect(p.labelUrl, 'labelUrl').toMatch(/^https:\/\//)
      })

      it('says something useful in notes', () => {
        expect(p.notes.length).toBeGreaterThan(10)
      })

      it('only claims a spreader setting for a granular product', () => {
        if (p.form === 'liquid') expect(p.settings).toBeUndefined()
      })

      it('only claims a per-gallon spot rate for a liquid', () => {
        if (p.form === 'granular') expect(p.ozPerGallon).toBeUndefined()
      })

      it('keeps prohibited spreaders separate from published ones', () => {
        ;(p.notLabeledFor || []).forEach((id) => {
          expect(spreaderById[id], `unknown spreader ${id}`).toBeTruthy()
          const published = (p.settings || []).some((s) => s.spreaderId === id)
          expect(published, `${id} is both forbidden and published`).toBe(false)
        })
      })

      it('measures a dry concentrate by weight, and only a liquid at all', () => {
        if (p.measure) {
          expect(p.form).toBe('liquid')
          // A dry powder has no fl-oz-per-gallon mix to print.
          if (p.measure === 'oz wt') expect(p.ozPerGallon).toBeUndefined()
        }
      })

      it('is labeled for turf we recognize', () => {
        ;(p.turf || []).forEach((t) => expect(['cool', 'mixed', 'warm']).toContain(t))
      })
    })
  })

  it('covers every task the calendar can put in a window', () => {
    // Not a completeness demand on the calendar — just a check that the tasks a
    // product claims add up to the ones people actually buy something for.
    const covered = new Set(products.flatMap((p) => p.taskIds))
    ;[
      'post-em-broadleaf',
      'post-em-grassy',
      'pre-em-spring',
      'pre-em-fall',
      'fertilization',
      'grub-preventative',
      'seeding',
      'lawn-kill',
    ].forEach((id) => expect(covered.has(id), `nothing to apply for ${id}`).toBe(true))
  })
})
